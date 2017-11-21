[![CircleCI](https://circleci.com/gh/transcovo/chpr-blocked.svg?style=shield&circle-token=34f2510e960a3185bf5a47ec89961f6fe63817f4)](https://circleci.com/gh/transcovo/chpr-blocked)
[![codecov](https://codecov.io/gh/transcovo/chpr-blocked/branch/master/graph/badge.svg)](https://codecov.io/gh/transcovo/chpr-blocked)

chpr-blocked is a tiny utility to monitor event loop blocking, inspired from [tj/blocked](https://github.com/tj/node-blocked),
but configurable with environment variables.

When the event loop is blocked for more than a set threshold (defaults to 100ms), a log
is emitted (using the specified level) using chpr-logger, and metrics are sent (increment + timing).

There is a "warmup delay" (defaults to 2000ms), because it's ok to use a lot of CPU in
at the statup of the node app (e.g. to require most of the app code).


## Installation

Install the package.

    npm i chpr-blocked --save

Then require the module in the entry point in your code (e.g. server.js, worker.js, etc...).

    require('chpr-blocked').start();


## Configuration

The configuration is done with environment variables.

| Name  | Description  | Default  |
|---|---|---|
| BLOCKED_DELAY | The tolerated warmup time after requiring chpr-blocked, milliseconds  | 2000 |
| BLOCKED_THRESHOLD | The threshold above which a log/metric is emitted, once the warmup delay is over | 100 |
| BLOCKED_LOGGER_LEVEL | The logger level to apply on a blocked process | error