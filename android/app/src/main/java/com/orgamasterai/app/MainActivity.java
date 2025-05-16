package com.orgamasterai.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Gebruik ALLEEN de theme in AndroidManifest.xml, geen SplashScreen API aanroepen
        super.onCreate(savedInstanceState);
    }
}
