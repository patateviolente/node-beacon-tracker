# Node beacon tracker
This is a NodeJS project you can use to track a moving Bluetooth target in a restricted area. The project should be run distributed on at least 3 access points, which listens to a passive beacon signal emitter strength.
When a beacon signal is found, the signal is sent to the master node. All nodes has to be on a same Network or over Internet.

The Node master receives all Bluetooth signals from slaves nodes using basic HTTP calls `GET /piname/00:aa:bb:cc:dd:ee:ff/-50` and do the rest of the app.
The master aggregates response by small amount of time. When all Nodes received a signal, a triangulation is made according each Node position according the configuration.

Positions can be delimited in groups of bounds. When a position is in a defined bound, a bluetooth action can be triggered.
You can use this feature in some ways. This project aim is not to become a `npm` package you can clone it and trigger an action if you need this feature.


## Usage
### Configuring your beacons
The programs collects position of as many Bluetooth devices as defined in `beacons`.
You need to:
- identify your beacon with a `name` and its `mac`
- [benchmark the `reference` power ](#Benchmark-your-beacon) signal strength (RSSI) for your beacon,
- override the [`aggregate` strategy](#collect-strategy)
- defined some pairing action if your target [run away](#runaway-bounds)!

```json5
{
  name: 'Tora_Nut',
  mac: '71:bc:23:4c:72:5b',
  reference: {
    distance: 1,
    rssi: { pi1: -54, pi2: -63, pi3: -64 }
  },
  aggregate: { strategy: 'continuous' },
  pair: {}   // Refer to "Runaway bounds"
}
```


### Configuring access point
The trilateration works in an orthonormal marker. All access point should have a `x` and `y` position set
```json5
{
  accessPoints: {
    pi1: {
      master: true,
      url: 'pimaster',
      x: 0,
      y: 0,
    },
    pi2: { x: 0.5, y: 8 },
    pi3: { x: 7.5, y: 9 },
  },
}
```


### Collect strategy
The aggregation instance collects all beacons strengths. There are two strategies available:

- `when_available`: when all access points receives a Beacon signal, the position is processed. If your beacon broadcast a frame every 2 seconds, the position will be actualized every 2 seconds too.

- `continuous`: will process a position every `interval`. If a signal already had been saved for a same AP, the best signal is chosen.

For both strategy; if an AP is missing data, the `tracker.partialData` is called after the defined `timeout`. Complete position uses `tracker.newPosition` callback.


```json5
{
  aggregate: {
    timeout: 10000, // Maximum time we wait all ap measures
    interval: 5000, // Time between each position event in 'continuous' strategy
    strategy: 'continuous'
  },
}
```

This configuration can be overridden in each Beacon configuration.


### Runaway bounds
When a position is found, you can define some blacklisted bounds positions.

```json5
runawayBounds: [
  [[-Infinity, -Infinity], [-1, 8]],
  [[9, -Infinity], [Infinity, 8]]
],
```

The program will pair the device and trigger a Bluetooth service defined for the beacon.



## Benchmark your beacon
Positions are calculated using an RSSI mesure on a defined distance, generally 1 meter. This strength can vary depending the receptor antenna quality or the beacon steadiness.

In this sample configuration, all AP has been placed on the same position and the beacon was placed 3 meters away. Run the sample app `npm run benchmark` and let it run a few minutes. This will progressively fill the ugly output as below:
```
Benchmarking device in 71:bc:23:4c:72:5b run 652s
Device 71:bc:23:4c:72:5b:
 - pi1: 415 signals / min -55 / avg -60 / every 3.33s
-55x23 -56x117 -57x5 -58x50 -59x78 -63x5 -64x50 -65x86 -67x1

 - pi2: 412 signals / min -55 / avg -60 / every 3.33s
-55x2 -56x3 -57x97 -58x55 -59x121 -60x4 -61x2 -62x6 -63x7 -64x67 -65x47 -66x1

 - pi3: 410 signals / min -55 / avg -60 / every 3.33s
-55x5 -56x97 -57x73 -58x101 -59x4 -60x8 -62x7 -63x67 -64x48
```

For this example:
- the beacon is measured at a distance of 3 meters which must be set in `reference.distance`,
- the beacon is fairly unstable, let's take the average signal strength
- it's so unstable that it would be better to have at least 2 signals to make position more accurate, let's set the strategy as `continuous` with an interval of `7000`ms (> 2*3.33)
```json5
{
  beacons: [{
    ...
    aggregate: {
      strategy: 'continuous'
      interval: 7000
    },
    reference: {
      distance: 3,
      rssi: { pi1: -60, pi2: -60, pi3: -60 }
    }
  }]
}
```

### About RSSI and how to improve positioning
The RSSI value is roughly generally between 0 (generally from -50 for a small passive non powerful beacon), and -100 (far).
As the signal strength is measured in 3 dimensions, the strengh follow `x²`, see `tests/trilateration.js` to get a better idea.

If your Bluetooth beacon has inconstant strength, the position will wiggle. The example above is an inconstant beacon ; the result `-57x97 -58x55 -59x121` is not worrying for final positioning. But following `-64x67 -65x47` means that nearly a third of cases, your beacon will seem 2 time farther.

To solve this (not by buying a better beacon), you should use the `aggregate.strategy: 'continuous'`. This will result as less but more accurate positions.

## Example using PI Zero W boards
For this project, I used Raspberry Pi Zero W, because it's unexpensive for Wifi/Bluetooth devices.
If you've got soldering skills, you can try to hack them with [an U.fl SMA antenna](https://www.briandorey.com/post/raspberry-pi-zero-w-external-antenna-mod) to get more range.
