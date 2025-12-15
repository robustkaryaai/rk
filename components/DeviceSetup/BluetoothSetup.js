'use client';

import { useState, useEffect } from 'react';
import { AiOutlineWifi, AiOutlineLoading3Quarters, AiOutlineCheckCircle } from 'react-icons/ai';
import { MdBluetooth } from 'react-icons/md';
import GlassCard from '@/components/GlassCard';
import { Capacitor } from '@capacitor/core';

// Standard Nordic UART Service UUIDs - Update these if your microcontroller uses different ones!
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write to device
const CHARACTERISTIC_UUID_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Read from device

export default function BluetoothSetup({ slug, onComplete, onCancel }) {
    const [step, setStep] = useState('connect'); // connect, wifi, writing, success, error
    const [device, setDevice] = useState(null);
    const [server, setServer] = useState(null);
    const [characteristic, setCharacteristic] = useState(null);
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, msg]);

    const connectBluetooth = async () => {
        try {
            setError('');
            addLog('Requesting Bluetooth Device...');

            const hasWebBluetooth = typeof navigator !== 'undefined' && navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function';
            const isNative = typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function' ? Capacitor.isNativePlatform() : false;

            if (hasWebBluetooth) {
                const device = await navigator.bluetooth.requestDevice({
                    filters: [{ namePrefix: 'rk-ai-' }],
                    optionalServices: [SERVICE_UUID]
                });

                console.log('Device selected:', device.name);
                addLog(`Device selected: ${device.name}`);
                setDevice(device);

                addLog('Connecting to GATT Server...');
                const server = await device.gatt.connect();
                setServer(server);
                addLog('Hold tight, finding services...');

                const service = await server.getPrimaryService(SERVICE_UUID);
                addLog('Service found.');

                const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);
                addLog('Characteristic found. Ready to write.');
                setCharacteristic(characteristic);

                setStep('wifi');

                device.addEventListener('gattserverdisconnected', onDisconnected);
            } else if (isNative) {
                const { Browser } = await import('@capacitor/browser');
                addLog('Opening browser for Bluetooth pairing...');
                await Browser.open({ url: 'https://rk-alpha-nine.vercel.app/connect' });
                throw new Error('Web Bluetooth unavailable in Android WebView');
            } else {
                throw new Error('Bluetooth not supported on this platform');
            }

        } catch (err) {
            console.error('Bluetooth Error:', err);
            setError(`Connection Failed: ${err.message}`);
            addLog(`Error: ${err.message}`);
        }
    };

    const onDisconnected = () => {
        addLog('Device disconnected.');
        // If not finished, show error or reset
        if (step !== 'success') {
            setError('Device disconnected unexpectedly.');
        }
    };

    const sendCredentials = async (e) => {
        e.preventDefault();
        if (!ssid || !password) return;

        setStep('writing');
        setError('');

        try {
            if (!characteristic) throw new Error('No connection to device');

            // JSON format: { "s": "slug", "w": "ssid", "p": "password" }
            // Using shorthand keys to save bytes if needed, but standard JSON is fine
            const payload = JSON.stringify({
                slug: slug,
                ssid: ssid,
                pass: password
            });

            const encoder = new TextEncoder();
            await characteristic.writeValue(encoder.encode(payload));
            addLog('Credentials sent successfully!');

            // Wait a moment for device to process
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('success');

            // Disconnect after success
            if (device && device.gatt.connected) {
                device.gatt.disconnect();
            }

            setTimeout(() => {
                onComplete();
            }, 3000);

        } catch (err) {
            console.error('Write Error:', err);
            setError(`Failed to send credentials: ${err.message}`);
            setStep('wifi'); // Go back to try again
        }
    };

    return (
        <GlassCard style={{ padding: '32px', textAlign: 'center' }}>
            {step === 'connect' && (
                <>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                        Connect to RK-AI Device
                    </h2>
                    <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                        Make sure your device is powered on and in range.
                    </p>
                    <button
                        onClick={connectBluetooth}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <MdBluetooth size={20} style={{ marginRight: '8px' }} />
                        Search Device
                    </button>
                </>
            )}



            {step === 'wifi' && (
                <form onSubmit={sendCredentials}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
                        WiFi Setup
                    </h2>
                    <p style={{ marginBottom: '24px', opacity: 0.8 }}>
                        Enter WiFi credentials for the device.
                    </p>

                    <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
                        <label className="form-label">WiFi Name (SSID)</label>
                        <div className="ai-input-wrapper">
                            <input
                                type="text"
                                className="ai-command-input"
                                value={ssid}
                                onChange={(e) => setSsid(e.target.value)}
                                placeholder="Enter WiFi Name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px', textAlign: 'left' }}>
                        <label className="form-label">WiFi Password</label>
                        <div className="ai-input-wrapper">
                            <input
                                type="password"
                                className="ai-command-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter WiFi Password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <AiOutlineWifi size={20} style={{ marginRight: '8px' }} />
                        Connect Device
                    </button>
                </form>
            )}

            {step === 'writing' && (
                <div style={{ padding: '20px' }}>
                    <AiOutlineLoading3Quarters className="spinning" size={48} color="#667eea" />
                    <p style={{ marginTop: '16px', fontWeight: '500' }}>Configuring Device...</p>
                </div>
            )}

            {step === 'success' && (
                <div style={{ padding: '20px' }}>
                    <AiOutlineCheckCircle size={48} color="#10b981" />
                    <p style={{ marginTop: '16px', fontWeight: '500', fontSize: '18px' }}>Setup Complete!</p>
                    <p style={{ opacity: 0.7 }}>Device is connecting to WiFi...</p>
                </div>
            )}

            {error && (
                <div style={{ marginTop: '20px', color: '#ff6b6b', background: 'rgba(255,0,0,0.1)', padding: '12px', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            <button
                onClick={onCancel}
                className="btn-ghost"
                style={{ marginTop: '16px', fontSize: '14px', margin: '16px auto', display: 'block' }}
            >
                Cancel
            </button>

            {step === 'connect' && (
                <div style={{ marginTop: '16px', textAlign: 'center', width: '100%' }}>
                    <span
                        onClick={onComplete}
                        style={{
                            fontSize: '13px',
                            opacity: 0.5,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Setup device later
                    </span>
                </div>
            )}
        </GlassCard>
    );
}
