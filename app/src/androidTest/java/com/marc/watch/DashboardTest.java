package com.marc.watch;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import static androidx.test.espresso.Espresso.*;
import static androidx.test.espresso.action.ViewActions.*;
import static androidx.test.espresso.assertion.ViewAssertions.*;
import static androidx.test.espresso.matcher.ViewMatchers.*;

@RunWith(AndroidJUnit4.class)
public class DashboardTest {
    @Test public void startsWithNoInventedReadingsAndOpensSetup() throws Exception {
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)) {
            onView(withText("Connect watch")).check(matches(isDisplayed()));
            onView(withText("Waiting for your first reading")).check(matches(isDisplayed()));
            onView(withText("Huawei GT6 setup")).perform(click());
            onView(withText("Got it")).check(matches(isDisplayed())).perform(click());
            onView(withText("Privacy & data")).perform(scrollTo(),click());
            onView(withSubstring("Readings stay in this app’s memory")).check(matches(isDisplayed()));
            androidx.test.espresso.Espresso.pressBack();
            onView(withText("Choose data source")).perform(scrollTo(),click());
            onView(withText("No shared sources yet")).check(matches(isDisplayed()));
        }
    }
    @Test public void recreatesActivityWithoutStartingABluetoothSession() {
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)) {
            scenario.recreate();onView(withText("Connect watch")).check(matches(isDisplayed()));
            onView(withText("Waiting for your first reading")).check(matches(isDisplayed()));
        }
    }
}
