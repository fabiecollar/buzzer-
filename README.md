# BUZZER — WiFi Order Pager System

## Setup (one time)

1. Install Node.js from https://nodejs.org
2. Open Terminal in this folder
3. Run: `npm install`

## Start the server

```
node server.js
```

You'll see:

```
  ✅ Server running
  📱 Open on any phone on this WiFi:
     http://192.168.x.x:3000
```

## Use it

- **Staff tablet/laptop** → open the URL → tap STAFF
- **Customer phones** → scan QR or open the same URL → tap CUSTOMER → enter order number

Staff adds order numbers to the queue, selects one, hits CALL.
Matching customer phone vibrates + beeps + flashes.

## Works on

- Any Android phone (Chrome)
- Any iPhone (Safari)
- Any laptop browser
- All devices must be on the same WiFi network
