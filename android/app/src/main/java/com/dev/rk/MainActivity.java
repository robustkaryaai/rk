package com.dev.rk;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// Plugins auto-registered by Capacitor in most cases; if manual registration is needed add here.
		// Example:
		// ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>();
		// plugins.add(com.codetrixstudio.capacitor.googleauth.GoogleAuth.class);
		// this.init(savedInstanceState, plugins);
	}
}
