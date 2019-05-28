# Node beacon tracker
This is a NodeJS project you can use to track a small moving target in a restricted area covered by bluetooth.

The project is hosted on (at least) 3 access points, which listens to a passive beacon signal emitter.
When a beacon signal is found, the signal is sent to the a tagged master. All nodes has to be on a same Network.

The Node master receives all bluetooth signals from slaves nodes using basic HTTP calls `GET /piname/00:aa:bb:cc:dd:ee:ff/-50`.
The master aggregates response by small amount of time. When all Nodes received a signal, a triangulation is made according each Node position according the configuration.

### Example using PI Zero W boards
For this project, I used Raspberry Pi Zero W, because it's unexpensive for Wifi/Bluetooth devices.
If you've got soldering skills, you can try to hack them with [an U.fl SMA antenna](https://www.briandorey.com/post/raspberry-pi-zero-w-external-antenna-mod) to get more range.
