# Getting Started with it

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

# How it works


This connects to the arduino using a UUID, and sometimes you may need to attempt to connect using a broader search as the name SRDriver does not always appear in the device list - it may appear as "Arduino".

Make sure your esp32 (or similar Arduino BLE device) is powered on, then load the page.

You will see no devices
<img width="527" alt="Screenshot 2025-06-24 at 7 11 45 AM" src="https://github.com/user-attachments/assets/1d3f5262-fa3e-45eb-8e79-d07500b42066" />

So add one, then try to connect:

<img width="758" alt="Screenshot 2025-06-24 at 7 12 42 AM" src="https://github.com/user-attachments/assets/d7e273eb-2e90-4822-a32e-b128c5a342b1" />

Choose the device (you may have to hit cancel once):

<img width="585" alt="Screenshot 2025-06-24 at 7 12 58 AM" src="https://github.com/user-attachments/assets/56bf7274-dd7d-4413-96f9-ebaa64c34c24" />

Then enter the pin and hit Authenticate:

<img width="969" alt="Screenshot 2025-06-24 at 7 14 03 AM" src="https://github.com/user-attachments/assets/6510b789-d985-456f-8a44-f9f728a5857a" />

If it fails, refresh the page and try again.

Once authenticated, the control should unlock and you should be able to use the controls.
