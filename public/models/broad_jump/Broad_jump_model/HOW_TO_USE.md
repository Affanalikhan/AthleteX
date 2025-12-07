# 🚀 How to Use - Web Version

## ✅ Everything Runs in Your Browser (Not Terminal!)

The web version shows everything in the browser:
- ✅ Instructions on web page
- ✅ Camera view in browser
- ✅ Voice instructions (spoken by browser)
- ✅ Countdown on screen
- ✅ Results displayed on page
- ❌ NO terminal output needed!

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start the Server

**Option A: Double-click** (Windows)
```
Double-click: START_TEST.bat
```

**Option B: Command line**
```bash
python run_server.py
```

### Step 2: Browser Opens Automatically

The browser will open to: `http://localhost:8000/simple_jump_test.html`

### Step 3: Follow On-Screen Instructions

Everything happens in the browser!

---

## 📱 What You'll See in Browser

### Screen 1: Instructions
```
🏃 Broad Jump Distance Test

📋 Instructions
✓ Camera Setup: Position camera to the SIDE
✓ Your Position: Stand SIDEWAYS to camera
✓ Jump Direction: Jump FORWARD
✓ Controls: Press SPACE or click button
✓ Trials: You get 3 attempts

[Start Test] button
```

### Screen 2: Loading
```
Loading AI Model...
Please wait...
```

### Screen 3: Camera View
```
[Live camera feed showing you]

Trial: 1 / 3
Status: Ready
Distance: -

[Press SPACE to Start Trial] [Skip Trial]
```

### Screen 4: During Trial
```
[Camera view with countdown]

READY
3
2
1
START!

[Tracking your jump with green dot]
```

### Screen 5: Results
```
🎉 Test Complete!

Best: 2.45 meters

Trial 1: 2.35m
Trial 2: 2.45m
Trial 3: 2.40m

[New Test]
```

---

## 🔊 Voice Instructions (Spoken by Browser)

You will HEAR (not see in terminal):
1. "Loading system. Please wait."
2. "System ready. Press space to start trial 1."
3. "Trial 1. Stand in position."
4. "READY" → "3" → "2" → "1" → "START!"
5. "You jumped 2.35 meters."
6. "Press space for next trial."
7. "Test complete. Your best jump was 2.45 meters."

---

## 🎮 Controls (In Browser)

- **SPACE bar** - Start trial
- **Click button** - Start trial
- **Skip Trial button** - Skip current trial

---

## 📐 Camera Setup

```
✅ CORRECT Setup:

    📷 Camera (Side View)
    ↓
    ┌─────────────────────────────────────┐
    │                                     │
    │  🚶 ═══════════► 🏃                │
    │  You          Jump forward          │
    │  (sideways)                         │
    │                                     │
    └─────────────────────────────────────┘
```

**Important:**
- Camera on the SIDE (not front)
- You stand SIDEWAYS
- Jump FORWARD

---

## 🔧 Troubleshooting

### "Browser doesn't open"
1. Manually open browser
2. Go to: `http://localhost:8000/simple_jump_test.html`

### "Camera permission denied"
1. Click "Allow" when browser asks
2. Check browser settings → Privacy → Camera

### "No voice"
1. Check system volume
2. Try Chrome browser (best support)
3. Voice will still show as text on screen

### "Jump not detected"
1. Ensure camera is on the SIDE
2. Stand SIDEWAYS to camera
3. Jump with more force
4. Stay in camera view

---

## 💡 Key Differences

### ❌ Python Version (Terminal):
- Shows text in terminal
- Requires manual input
- Complex calibration
- Desktop only

### ✅ Web Version (Browser):
- Everything in browser
- Click buttons
- Automatic distance
- Works on any device

---

## 🎯 Complete Workflow

```
1. Double-click START_TEST.bat
   ↓
2. Browser opens automatically
   ↓
3. Read instructions on page
   ↓
4. Click "Start Test"
   ↓
5. Allow camera access
   ↓
6. Press SPACE when ready
   ↓
7. Stand still (shown on screen)
   ↓
8. Countdown appears: 3, 2, 1, START!
   ↓
9. JUMP!
   ↓
10. Result shown on screen
    ↓
11. Press SPACE for next trial
    ↓
12. Repeat for 3 trials
    ↓
13. See final results on page
```

**Total time: 3-5 minutes**

---

## ✅ Browser Requirements

**Best:** Chrome 90+
**Good:** Edge 90+, Firefox 88+
**OK:** Safari 14+

**Must have:**
- Camera access
- JavaScript enabled
- Internet connection (for AI model)

---

## 📊 What Gets Calculated Automatically

The system automatically:
1. ✅ Detects your body
2. ✅ Tracks ankle movement
3. ✅ Measures pixel distance
4. ✅ Converts to meters
5. ✅ Shows result on screen

**No calibration needed!**
**No reference objects needed!**
**No terminal input needed!**

---

## 🎉 Summary

**To use:**
1. Double-click `START_TEST.bat`
2. Browser opens
3. Follow on-screen instructions
4. Everything happens in browser!

**No terminal interaction needed!**

---

## 📞 Still Having Issues?

Make sure:
- [ ] Python is installed
- [ ] Browser is modern (Chrome recommended)
- [ ] Camera is connected
- [ ] You're running `START_TEST.bat` or `python run_server.py`
- [ ] Browser opens to `http://localhost:8000/simple_jump_test.html`

---

**Just double-click START_TEST.bat and everything runs in your browser!** 🚀
