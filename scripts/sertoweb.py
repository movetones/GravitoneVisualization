#!/usr/bin/python
#
# This script reads serial data from a Gravitone and rebroadcasts it
# it over a locally hosted websocket server.
#
# Matt Ruffner 2022
# MoveTones, LLC
# 
# Thanks steveio for the base of the script 
# http://www.steveio.com/2020/07/11/arduino-serial-to-websocket-in-python/


import sys
import serial
import asyncio
import datetime
import random
import websockets
import signal
import time
import threading

if len(sys.argv) < 2:
    print("need port")
    sys.exit(1)


ser = serial.Serial(
port=sys.argv[1],\
baudrate=115200,\
parity=serial.PARITY_NONE,\
stopbits=serial.STOPBITS_ONE,\
bytesize=serial.EIGHTBITS,\
timeout=0)
 
print("Connected to: " + ser.portstr)

async def tx(websocket, path):
  line = []
  while True:
    for i in ser.read():
      c = chr(i)
      line.append(c)
      if c == '\n':
        #print(''.join(line))
        await websocket.send(''.join(line))
        line = []
        break

stop_event = threading.Event()

def handler(signum, frame):
  print("")
  #msg = "signum: {}, frame: {} ".format(signum, frame)
  #print(msg, end="", flush=True)
  print("Closing serial port...")
  stop_event.set()
  ser.close()
  exit(1)

 
signal.signal(signal.SIGINT, handler)
signal.signal(signal.SIGTERM, handler)

websocket = websockets.serve(tx, "127.0.0.1", 5678)

asyncio.get_event_loop().run_until_complete(websocket)
asyncio.get_event_loop().run_forever()


#stop = asyncio.get_event_loop().run_in_executor(None, stop_event.wait)

