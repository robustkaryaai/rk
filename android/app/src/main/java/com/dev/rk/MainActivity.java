package com.dev.rk;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import com.capacitorjs.community.plugins.bluetoothle.BluetoothLe;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>();
		plugins.add(BluetoothLe.class);
		this.init(savedInstanceState, plugins);
	}
}
