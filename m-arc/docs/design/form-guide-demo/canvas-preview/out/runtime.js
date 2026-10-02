/* runtime.js: a small stand-in for the Design canvas runtime, used only because the owner's account has no
   Design canvas type. It renders <x-dc> artboard markup (the part after </helmet>) with the artboard's
   `class Component extends DCLogic`, as FORMAT-RULES.md describes:
   - {{dotted.path}} holes in text and attributes (whole-attribute holes pass the raw value);
   - <sc-if value>, <sc-for list as> with {{ item.x }} and {{ $index }};
   - on<Event>="{{ fn }}" handlers (React names: onClick, onScroll, onInput, onChange...);
   - <dc-import name="X" ...props> mounts component X; its instance and state survive parent re-renders (keyed by position);
   - props (defaults from data-props), state, setState (batched), forceUpdate, componentDidMount/DidUpdate/WillUnmount;
   - <a href="X.dc.html"> opens the preview page X.html, as Play would move to that artboard.
   The DOM is patched in place on every update, so scroll positions, focus and running CSS animations survive.
   Anything else throws "dc-runtime: unsupported construct: ..." and replaces the board with the error: never a silent misrender.
   Helmet styles of each component are on only while that component is mounted (they share class and keyframe names). */
(function (global) {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK_NS = 'http://www.w3.org/1999/xlink';
  const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
  const FORBIDDEN = new Set('script iframe object embed template textarea title helmet x-dc noscript frame frameset'.split(' '));
  const BOOL_ATTRS = new Set(('allowfullscreen async autofocus autoplay checked controls default defer disabled formnovalidate hidden ' +
    'inert ismap loop multiple muted nomodule novalidate open playsinline readonly required reversed selected').split(' '));
  const REACT_ONLY = new Set(['ref', 'key', 'classname', 'htmlfor', 'dangerouslysetinnerhtml']);
  const FORM = new Set(['input', 'select', 'textarea']);
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  const PATH = /^[A-Za-z_$][\w$]*(?:\.[\w$]+)*$/;
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  class DCError extends Error {
    constructor(msg) { super('dc-runtime: ' + msg); this.name = 'DCError'; }
  }
  const unsupported = (what, where) => new DCError('unsupported construct: ' + what + (where ? ' (' + where + ')' : ''));

  /* ---------- markup parser (strict: every non-void element closed, every attribute quoted) ---------- */
  function decode(s, where) {
    return s.replace(/&(#\d+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);/g, (m, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      if (hasOwn(ENT, e)) return ENT[e];
      if (typeof document === 'undefined') return m; // build time (node): the browser decodes and checks it
      const ta = document.createElement('textarea');
      ta.innerHTML = m;
      if (ta.value === m) throw unsupported('entity ' + m, where);
      return ta.value;
    });
  }
  // "a {{ b.c }} d" -> ['a ', {path:['b','c']}, ' d'] (literal parts entity-decoded); null when there is no hole.
  function holes(s, where, raw) {
    if (s.indexOf('{{') < 0) {
      if (s.indexOf('}}') >= 0) throw unsupported('stray "}}"', where);
      return null;
    }
    const parts = [], re = /\{\{([\s\S]*?)\}\}/g;
    let i = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > i) parts.push(s.slice(i, m.index));
      const p = m[1].trim();
      if (!PATH.test(p)) throw unsupported('hole "{{' + m[1] + '}}" is not a dotted path', where);
      parts.push({ path: p.split('.') });
      i = re.lastIndex;
    }
    if (i < s.length) parts.push(s.slice(i));
    return parts.map(x => {
      if (typeof x !== 'string') return x;
      if (x.indexOf('{{') >= 0 || x.indexOf('}}') >= 0) throw unsupported('stray braces', where);
      return raw ? x : decode(x, where);
    });
  }

  // Source position, turned into "File.dc.html markup, line N" only when an error message needs it.
  class Where {
    constructor(comp, src, pos) { this.comp = comp; this.src = src; this.pos = pos; }
    toString() { return this.comp + '.dc.html markup, line ' + this.src.slice(0, this.pos).split('\n').length; }
  }
  function parse(src, comp) {
    const root = { t: 1, tag: '#root', ns: null, kids: [] };
    const stack = [root];
    let i = 0, uid = 0;
    const at = k => new Where(comp, src, k);
    const top = () => stack[stack.length - 1];
    const text = (s, k, raw) => {
      if (!s) return;
      const parts = holes(s, at(k), raw);
      top().kids.push({ t: 3, id: uid++, parts: parts || [raw ? s : decode(s, at(k))], where: at(k) });
    };
    const TAG = /<([A-Za-z][\w:-]*)/y, CLOSE = /<\/([A-Za-z][\w:-]*)\s*>/y, END = /\s*(\/?)>/y;
    const ATTR = /\s+([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y;
    while (i < src.length) {
      const lt = src.indexOf('<', i);
      if (lt < 0) { text(src.slice(i), i); break; }
      if (lt > i) text(src.slice(i, lt), i);
      i = lt;
      if (src.startsWith('<!--', i)) {
        const e = src.indexOf('-->', i + 4);
        if (e < 0) throw unsupported('unclosed comment', at(i));
        i = e + 3;
        continue;
      }
      if (src[i + 1] === '/') {
        CLOSE.lastIndex = i;
        const m = CLOSE.exec(src);
        if (!m) throw unsupported('malformed end tag', at(i));
        const el = top(), name = el.ns ? m[1] : m[1].toLowerCase();
        if (el === root || el.tag !== name) throw unsupported('</' + m[1] + '> does not close <' + (el === root ? 'nothing' : el.tag) + '>', at(i));
        stack.pop();
        i = CLOSE.lastIndex;
        continue;
      }
      TAG.lastIndex = i;
      const m = TAG.exec(src);
      if (!m) {
        if (src[i + 1] === '!' || src[i + 1] === '?') throw unsupported('markup declaration "' + src.slice(i, i + 12) + '"', at(i));
        text('<', i);
        i++;
        continue;
      }
      const parent = top();
      const ns = (parent.ns === SVG_NS && parent.tag !== 'foreignObject') || m[1].toLowerCase() === 'svg' ? SVG_NS : null;
      const tag = ns ? m[1] : m[1].toLowerCase();
      const attrs = [];
      let j = TAG.lastIndex, selfClose = false;
      for (;;) {
        END.lastIndex = j;
        const e = END.exec(src);
        if (e) { j = END.lastIndex; selfClose = e[1] === '/'; break; }
        ATTR.lastIndex = j;
        const a = ATTR.exec(src);
        if (!a) throw unsupported('malformed tag <' + tag + '>', at(i));
        if (a[4] !== undefined) throw unsupported('unquoted attribute ' + a[1] + ' on <' + tag + '>', at(i));
        const name = ns ? a[1] : a[1].toLowerCase();
        if (attrs.some(x => x[0] === name)) throw unsupported('duplicate attribute ' + name + ' on <' + tag + '>', at(i));
        attrs.push([name, a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : null]);
        j = ATTR.lastIndex;
      }
      const node = { t: 1, id: uid++, tag, ns, attrs, kids: [], where: at(i) };
      parent.kids.push(node);
      i = j;
      if (!ns && VOID.has(tag)) continue;
      if (selfClose) {
        if (ns) continue;
        throw unsupported('self-closing <' + tag + '/> (HTML does not close it)', node.where);
      }
      if (!ns && tag === 'style') {
        const e = src.toLowerCase().indexOf('</style', i);
        if (e < 0) throw unsupported('unclosed <style>', at(i));
        stack.push(node);
        text(src.slice(i, e), i, true);
        i = e;
        continue;
      }
      stack.push(node);
    }
    if (stack.length > 1) throw unsupported('<' + top().tag + '> is never closed', top().where);
    return compile(root, comp);
  }

  /* ---------- compile: classify constructs, validate them once ---------- */
  function attrForm(name, v, where) {
    if (v === null) return { name, lit: '' };
    const parts = holes(v, where);
    if (!parts) return { name, lit: decode(v, where) };
    if (parts.length === 1 && typeof parts[0] !== 'string' && /^\s*\{\{[^}]*\}\}\s*$/.test(v)) return { name, path: parts[0].path };
    return { name, parts };
  }
  function compile(node, comp) {
    for (const k of node.kids) if (k.t === 1) compileEl(k, comp);
    return node;
  }
  function onlyHole(node, name) {
    const a = node.attrs.find(x => x[0] === name);
    if (!a || a[1] === null) throw unsupported('<' + node.tag + '> needs ' + name + '="{{ path }}"', node.where);
    const f = attrForm(name, a[1], node.where);
    if (!f.path) throw unsupported('<' + node.tag + ' ' + name + '> must be a single {{ path }} hole', node.where);
    return f.path;
  }
  function compileEl(node, comp) {
    const tag = node.tag, lname = tag.toLowerCase(), w = node.where;
    const known = (list) => node.attrs.forEach(([n]) => {
      if (list.indexOf(n) < 0 && !/^hint-/.test(n)) throw unsupported('attribute ' + n + ' on <' + tag + '>', w);
    });
    if (lname === 'sc-if') {
      known(['value']);
      node.kind = 'if';
      node.cond = onlyHole(node, 'value');
    } else if (lname === 'sc-for') {
      known(['list', 'as']);
      node.kind = 'for';
      node.list = onlyHole(node, 'list');
      const as = node.attrs.find(x => x[0] === 'as');
      if (!as || !/^[A-Za-z_][\w]*$/.test(as[1] || '') || as[1] === '$index') throw unsupported('<sc-for> needs as="name"', w);
      node.as = as[1];
    } else if (lname === 'dc-import') {
      node.kind = 'import';
      const nm = node.attrs.find(x => x[0] === 'name');
      if (!nm || !/^[\w-]+$/.test(nm[1] || '')) throw unsupported('<dc-import> needs a literal name="Component"', w);
      node.importName = nm[1];
      node.props = node.attrs.filter(([n]) => n !== 'name' && !/^hint-/.test(n)).map(([n, v]) => attrForm(n, v, w));
      if (node.kids.some(k => k.t === 1 || k.parts.some(p => typeof p !== 'string' || p.trim()))) throw unsupported('content inside <dc-import>', w);
      node.kids = [];
      return;
    } else {
      if (FORBIDDEN.has(lname)) throw unsupported('<' + tag + '> in markup', w);
      if (!node.ns && tag.indexOf('-') >= 0) throw unsupported('unknown element <' + tag + '>', w);
      node.kind = 'el';
      node.cattrs = [];
      node.events = [];
      for (const [n, v] of node.attrs) {
        const ln = n.toLowerCase();
        if (REACT_ONLY.has(ln)) throw unsupported('attribute ' + n + ' on <' + tag + '>', w);
        if (/^on[a-z]+$/.test(ln)) {
          const f = attrForm(n, v, w);
          if (!f.path) throw unsupported(n + ' must be a single {{ handler }} hole', w);
          node.events.push({ name: ln, path: f.path });
          continue;
        }
        if (ln === 'xmlns' || ln.indexOf('xmlns:') === 0) continue; // namespaces come from the element itself
        const f = attrForm(n, v, w);
        f.lname = ln;
        node.cattrs.push(f);
      }
    }
    compile(node, comp);
  }

  /* ---------- render: template + renderVals() -> virtual nodes ---------- */
  const missing = new Set();
  function lookup(ctx, path, where) {
    const head = path[0];
    let v;
    if (head in ctx.locals) v = ctx.locals[head];
    else if (hasOwn(ctx.vals, head)) v = ctx.vals[head];
    else {
      const k = ctx.host.def.name + ':' + path.join('.');
      if (!missing.has(k)) { missing.add(k); console.error('dc-runtime: hole {{ ' + path.join('.') + ' }} has no "' + head + '" in renderVals() (' + where + ')'); }
      return undefined;
    }
    for (let i = 1; i < path.length && v != null; i++) v = v[path[i]];
    return v;
  }
  function textVal(v, where) {
    if (v == null || typeof v === 'boolean') return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'bigint') return String(v);
    throw unsupported((Array.isArray(v) ? 'array' : typeof v) + ' value in a text hole', where);
  }
  function strVal(v, where) {
    if (v == null) return '';
    if (typeof v === 'object' || typeof v === 'function' || typeof v === 'symbol') throw unsupported(typeof v + ' value in an attribute', where);
    return String(v);
  }
  function attrVal(f, v, where) {
    if (v == null) return null;
    const t = typeof v;
    if (t === 'function' || t === 'symbol' || t === 'object') throw unsupported((Array.isArray(v) ? 'array' : t) + ' value for attribute ' + f.name, where);
    if (BOOL_ATTRS.has(f.lname)) return v ? '' : null;
    if (t === 'boolean') {
      if (/^(aria|data)-/.test(f.lname)) return String(v);
      throw unsupported('boolean value for attribute ' + f.name, where);
    }
    return String(v);
  }
  function propVal(f, ctx, where) {
    if (f.lit !== undefined) return f.lit;
    if (f.path) return lookup(ctx, f.path, where);
    return f.parts.map(p => typeof p === 'string' ? p : strVal(lookup(ctx, p.path, where), where)).join('');
  }
  function domEvent(name, tag, ns, attrs) {
    const base = name.slice(2);
    if (base === 'doubleclick') return 'dblclick';
    if (base === 'change' && !ns) {
      if (tag === 'textarea') return 'input';
      if (tag === 'input') {
        const ty = String(attrs.type || 'text').toLowerCase();
        return ty === 'checkbox' || ty === 'radio' ? 'click' : ty === 'file' ? 'change' : 'input';
      }
    }
    return base;
  }
  function build(kids, ctx, pre, out, rootLevel) {
    for (const node of kids) {
      if (node.t === 3) {
        if (rootLevel && node.parts.every(p => typeof p === 'string' && !p.trim())) continue;
        out.push({ t: 3, key: pre + node.id, text: node.parts.map(p => typeof p === 'string' ? p : textVal(lookup(ctx, p.path, node.where), node.where)).join('') });
      } else if (node.kind === 'if') {
        if (lookup(ctx, node.cond, node.where)) build(node.kids, ctx, pre, out, rootLevel);
      } else if (node.kind === 'for') {
        const list = lookup(ctx, node.list, node.where);
        if (!Array.isArray(list)) throw unsupported('<sc-for list> is not an array (' + (list === null ? 'null' : typeof list) + ')', node.where);
        list.forEach((item, i) => {
          const locals = Object.create(ctx.locals);
          locals[node.as] = item;
          locals.$index = i;
          build(node.kids, { host: ctx.host, vals: ctx.vals, locals, seen: ctx.seen }, pre + node.id + '.' + i + '/', out, rootLevel);
        });
      } else if (node.kind === 'import') {
        const props = {};
        for (const f of node.props) props[f.name] = propVal(f, ctx, node.where);
        out.push(ctx.host.child(pre + node.id, node.importName, props, ctx.seen));
      } else {
        const v = { t: 1, key: pre + node.id, tag: node.tag, ns: node.ns, attrs: {}, ev: null, props: null, kids: [], where: node.where };
        for (const f of node.cattrs) {
          const isProp = !node.ns && FORM.has(node.tag) && (f.lname === 'value' || f.lname === 'checked');
          let val;
          if (f.lit !== undefined) val = f.lit;
          else if (f.path) {
            const raw = lookup(ctx, f.path, node.where);
            if (isProp) {
              if (raw == null) continue;
              (v.props || (v.props = {}))[f.lname] = f.lname === 'checked' ? !!raw : strVal(raw, node.where);
              continue;
            }
            val = attrVal(f, raw, node.where);
          } else val = f.parts.map(p => typeof p === 'string' ? p : strVal(lookup(ctx, p.path, node.where), node.where)).join('');
          if (val === null) continue;
          if (isProp) { (v.props || (v.props = {}))[f.lname] = f.lname === 'checked' ? true : val; continue; }
          if (node.tag === 'a' && f.lname === 'href') val = val.replace(/^([\w-]+)\.dc\.html(?=$|[#?])/, '$1.html');
          v.attrs[f.name] = val;
        }
        for (const e of node.events) {
          const fn = lookup(ctx, e.path, node.where);
          if (fn == null) continue;
          if (typeof fn !== 'function') throw unsupported(e.name + ' value is ' + typeof fn + ', not a function', node.where);
          const type = domEvent(e.name, node.tag, node.ns, v.attrs);
          v.ev = v.ev || {};
          (v.ev[type] || (v.ev[type] = [])).push(fn);
        }
        build(node.kids, ctx, pre, v.kids, false);
        out.push(v);
      }
    }
    return out;
  }

  /* ---------- components ---------- */
  const defs = Object.create(null);
  function define(name, meta, factory) {
    if (defs[name]) throw new DCError('component "' + name + '" is defined twice');
    defs[name] = { name, meta, factory, tpl: null, Cls: null };
  }
  function getDef(name) {
    const d = defs[name];
    if (!d) throw new DCError('<dc-import name="' + name + '"> has no ' + name + '.dc.html');
    if (!d.tpl) d.tpl = parse(d.meta.markup, name);
    if (!d.Cls) {
      d.Cls = d.factory(DCLogic);
      if (typeof d.Cls !== 'function' || !(d.Cls.prototype instanceof DCLogic)) throw new DCError(name + ': the script must declare class Component extends DCLogic');
      if (typeof d.Cls.prototype.renderVals !== 'function') throw new DCError(name + ': Component has no renderVals()');
      if (typeof d.Cls.prototype.render === 'function') throw unsupported('render() in the logic class', name);
    }
    return d;
  }
  function defaults(d) {
    const out = {}, p = d.meta.props || {};
    for (const k of Object.keys(p)) if (k[0] !== '$' && p[k] && typeof p[k] === 'object' && hasOwn(p[k], 'default')) out[k] = p[k].default;
    return out;
  }

  const helmetCount = Object.create(null);
  function helmet(name, d) {
    const c = (helmetCount[name] || 0) + d;
    helmetCount[name] = c;
    if ((d > 0 && c !== 1) || (d < 0 && c !== 0) || typeof document === 'undefined') return;
    document.querySelectorAll('style[data-dc-helmet]').forEach(s => {
      if (s.getAttribute('data-dc-helmet') !== name) return;
      if (c) s.removeAttribute('media'); else s.setAttribute('media', 'not all');
    });
  }

  class DCLogic {
    constructor(props) { this.props = props; this.state = {}; }
    setState(update, cb) {
      const h = this.__dcHost;
      if (!h) { console.error('dc-runtime: setState() called before the component mounted (in its constructor)'); return; }
      if (h.dead) return;
      if (update != null) h.queue.push(update);
      if (typeof cb === 'function') h.cbs.push(cb);
      schedule();
    }
    forceUpdate(cb) {
      const h = this.__dcHost;
      if (!h || h.dead) return;
      h.dirty = true;
      if (typeof cb === 'function') h.cbs.push(cb);
      schedule();
    }
  }

  let hostUid = 0;
  class Host {
    constructor(def, props) {
      this.def = def; this.uid = ++hostUid; this.kids = new Map(); this.queue = []; this.cbs = []; this.ready = [];
      this.dirty = true; this.mounted = false; this.dead = false; this.pending = null; this.prevProps = null; this.vnodes = [];
      const logic = new def.Cls(props);
      logic.props = props;
      if (logic.state == null) logic.state = {};
      Object.defineProperty(logic, '__dcHost', { value: this });
      this.logic = logic;
      helmet(def.name, 1);
    }
    child(key, name, props, seen) {
      let kid = this.kids.get(key);
      if (kid && kid.def.name !== name) { this.kids.delete(key); unmount(kid); kid = null; }
      const d = getDef(name), full = Object.assign(defaults(d), props);
      if (!kid) { kid = new Host(d, full); this.kids.set(key, kid); }
      else { kid.prevProps = kid.logic.props; kid.logic.props = full; }
      seen.add(key);
      return { t: 'c', host: kid };
    }
  }
  function unmount(h) {
    if (h.dead) return;
    h.dead = true;
    if (h.mounted && typeof h.logic.componentWillUnmount === 'function') h.logic.componentWillUnmount();
    for (const k of h.kids.values()) unmount(k);
    h.kids.clear();
    helmet(h.def.name, -1);
  }
  function render(h, force) {
    let did = false;
    if (force || h.dirty || h.queue.length) {
      const prevState = h.logic.state;
      if (h.queue.length) {
        const st = Object.assign({}, prevState);
        for (const u of h.queue) {
          const part = typeof u === 'function' ? u.call(h.logic, st, h.logic.props) : u;
          if (part != null) Object.assign(st, part);
        }
        h.queue = [];
        h.logic.state = st;
      }
      h.ready = h.ready.concat(h.cbs);
      h.cbs = [];
      const vals = h.logic.renderVals();
      if (!vals || typeof vals !== 'object') throw new DCError(h.def.name + ': renderVals() must return an object');
      const seen = new Set();
      h.vnodes = build(h.def.tpl.kids, { host: h, vals, locals: Object.create(null), seen }, '', [], true);
      for (const [k, kid] of h.kids) if (!seen.has(k)) { h.kids.delete(k); unmount(kid); }
      if (h.mounted) h.pending = { props: h.prevProps || h.logic.props, state: prevState };
      h.prevProps = null;
      h.dirty = false;
      did = true;
    }
    let any = did;
    for (const kid of h.kids.values()) any = render(kid, did) || any;
    return any;
  }
  function lifecycle(h) {
    for (const kid of Array.from(h.kids.values())) lifecycle(kid);
    if (h.dead) return;
    const l = h.logic;
    if (!h.mounted) { h.mounted = true; h.pending = null; if (typeof l.componentDidMount === 'function') l.componentDidMount(); }
    else if (h.pending) { const p = h.pending; h.pending = null; if (typeof l.componentDidUpdate === 'function') l.componentDidUpdate(p.props, p.state); }
    const cbs = h.ready;
    h.ready = [];
    cbs.forEach(cb => cb.call(l));
  }

  /* ---------- DOM patching (keyed by template position) ---------- */
  function flat(vkids, out, prefix) {
    for (const v of vkids) {
      if (v.t === 'c') flat(v.host.vnodes, out, prefix + 'c' + v.host.uid + ':');
      else out.push([prefix + v.key, v]);
    }
    return out;
  }
  function dispatch(e) {
    const fns = this.__dce && this.__dce[e.type];
    if (fns) for (const f of fns) f(e);
  }
  function setAttr(n, k, v) {
    if (k === 'xlink:href') n.setAttributeNS(XLINK_NS, k, v); else n.setAttribute(k, v);
  }
  function patch(n, v) {
    if (v.t === 3) { if (n.data !== v.text) n.data = v.text; return; }
    const prev = n.__dca, next = v.attrs;
    for (const k in next) if (prev[k] !== next[k]) setAttr(n, k, next[k]);
    for (const k in prev) if (!hasOwn(next, k)) { if (k === 'xlink:href') n.removeAttributeNS(XLINK_NS, 'href'); else n.removeAttribute(k); }
    n.__dca = next;
    n.__dce = v.ev;
    if (v.ev) for (const type in v.ev) {
      if (!n.__dcl) n.__dcl = new Set();
      if (n.__dcl.has(type)) continue;
      if (!(('on' + type) in n)) throw unsupported('event "' + type + '" on <' + v.tag + '>', v.where);
      n.__dcl.add(type);
      n.addEventListener(type, dispatch);
    }
    morph(n, flat(v.kids, [], ''));
    if (v.props) {
      if (hasOwn(v.props, 'value') && n.value !== v.props.value) n.value = v.props.value;
      if (hasOwn(v.props, 'checked') && n.checked !== v.props.checked) n.checked = v.props.checked;
    }
  }
  function create(v) {
    if (v.t === 3) return document.createTextNode(v.text);
    const n = v.ns ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag);
    n.__dct = v.tag;
    n.__dca = {};
    patch(n, v);
    return n;
  }
  function morph(parent, list) {
    const live = new Map();
    for (let n = parent.firstChild; n;) {
      const nx = n.nextSibling;
      if (n.__dck !== undefined) live.set(n.__dck, n); else parent.removeChild(n);
      n = nx;
    }
    let cur = parent.firstChild;
    for (const [key, v] of list) {
      let n = live.get(key);
      if (n !== undefined) {
        live.delete(key);
        if (v.t === 3 ? n.nodeType !== 3 : n.__dct !== v.tag) {
          if (n === cur) cur = cur.nextSibling;
          parent.removeChild(n);
          n = undefined;
        }
      }
      if (n !== undefined) patch(n, v);
      else { n = create(v); n.__dck = key; }
      if (n === cur) cur = cur.nextSibling; else parent.insertBefore(n, cur);
    }
    for (const n of live.values()) parent.removeChild(n);
  }

  /* ---------- scheduling ---------- */
  const roots = [];
  let scheduled = false, burst = 0, burstReset = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(flush);
  }
  function fatal(err, r) {
    console.error(err && err.stack ? err.stack : String(err));
    if (r && !r.failed) {
      r.failed = true;
      r.el.textContent = '';
      const pre = document.createElement('pre');
      pre.setAttribute('data-dc-error', '');
      pre.style.cssText = 'margin:0;padding:12px;white-space:pre-wrap;font:12px/1.45 ui-monospace,monospace;color:#9b1c1c;background:#fff4f4;height:100%;box-sizing:border-box';
      pre.textContent = String(err && err.message || err);
      r.el.appendChild(pre);
    }
  }
  function flush() {
    scheduled = false;
    if (++burst > 60) { const e = new DCError('update loop: more than 60 renders without a pause (setState in componentDidUpdate?)'); roots.forEach(r => fatal(e, r)); throw e; }
    if (!burstReset) { burstReset = true; setTimeout(() => { burst = 0; burstReset = false; }, 0); }
    for (const r of roots) {
      if (r.failed) continue;
      try {
        if (render(r.host, false)) morph(r.el, flat(r.host.vnodes, [], ''));
        lifecycle(r.host);
      } catch (e) {
        fatal(e, r);
        throw e;
      }
    }
  }
  function mount(el, name, props) {
    const r = { el, host: null, failed: false };
    roots.push(r);
    try {
      const d = getDef(name);
      r.host = new Host(d, Object.assign(defaults(d), props || {}));
    } catch (e) { fatal(e, r); throw e; }
    el.textContent = '';
    flush();
    return r.host.logic;
  }

  const DC = { define, mount, parse, DCLogic, DCError };
  if (typeof module === 'object' && module && module.exports) module.exports = DC;
  global.DC = DC;
})(typeof globalThis !== 'undefined' ? globalThis : this);
