[![CircleCI](https://circleci.com/gh/transcovo/chpr-blocked.svg?style=shield)](https://circleci.com/gh/transcovo/chpr-blocked)
[![codecov](https://codecov.io/gh/transcovo/chpr-blocked/branch/master/graph/badge.svg)](https://codecov.io/gh/transcovo/chpr-blocked)

chpr-blocked is a tiny utility to monitor event loop blocking, inspired from tj/blocked,
but configurable with environment variables.

When the event loop is blocked for more than a set threshold (defaults to 100ms), an error log
is emitted, using chpr-logger.

There is a "warmup delay" (defaults to 2000ms), because it's ok to use a lot of CPU in
at the statup of the node app (e.g. to require most of the app code).


## Installation

Install the package.

    npm i chpr-blocked --save

Then require the module in the entry point in your code (e.g. server.js, worker.js, etc...).

    require('chrp-blocked').start();


## Configuration

The configuration is done with environment variables.

| Name  | Description  | Default  |
|---|---|---|
| BLOCKED_DELAY | The tolerated warmup time after requiring chpr-blocked, milliseconds  | 2000 |
| BLOCKED_THERSHOLD | (deprecated ) see BLOCKED_THRESHOLD, here for retro-compatibility | 100 |
| BLOCKED_THRESHOLD | The threshold above which an error will be logged, once the warmup delay is over | 100 |
