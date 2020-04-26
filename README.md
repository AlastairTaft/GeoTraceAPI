# What is it?
An API to privately store the location data for COVID-19 diagnosed cases in Tasmania. And improve the ability to contact trace. It stores location data from people that are both diagnosed and not diagnoses with COVID-19. For the simple ability that contacts can be immediately notifified if they have historically crossed paths with a newly diagnosed case.

All data points stored contain no personal information. The only identifying characteristic is an unguessable hashed ID that is only known to the user that hashed it and perhaps, in the future, a push notification token that allows the server to send notifications to the user.

# Why
This repo was forked from [here](https://github.com/AlastairTaft/track-covid-19-spread). The concept there was to make diagnosed people's location history publically accessible when given freely by the individual. However the location data here is collected in the background from an app so it does not feel acceptible to treat this data as the same and as such the data is private by default. Also both data from non infected cases and infected cases are tracked to make contact tracing more rapid, therefor it is all made private by default.

There is a production ready app that consumes this backend [here](https://github.com/AlastairTaft/TasTraceTogether).

# API 

## /submit-risk-map

Submit risk hashes. These are encrypted location points used to build a risk map.

Method: POST

### Parameters
| Name                              | Required | Description |
| --------------------------------- | -------- | ----------- |
| uniqueId                          | Yes      | Uniquely identifies this device, only known to the device |
| hashes[0].hash                    | Yes      | The hash that identifies this risk point |
| hashes[0].timePassedSinceExposure | Yes      | (In milliseconds) The time that has elapsed since this user visited the location | 

e.g.
```json
{
  "uniqueId": "xyz123",
  "hashes": [
    { "hash": "abc987", "timePassedSinceExposure": 300000 }
  ]
}
```

## /report-infected

Report the user is diagnosed with COVID-19.

Method: PUT

### Parameters
| Name     | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| uniqueId | String | Yes      | The uniqueId identifying the user. |
| code     | String | Yes      | The code proving this is a valid report, provided by a health authority as a QR code. |

e.g.

```json
{
  "uniqueId": "xyz123",
  "code": "health-code-123"
}
```

## /status

Get the user status, i.e. whether or not they are at risk or infected

Method: Get

### Parameters
| Name     | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| uniqueId | String  | Yes      | The uniqueId identifying the user. |

Returns an object with the prop 'infected' and 'atRisk', e.g.

```json
{
  "infected": false,
  "atRisk": false
}
```

## /get-salt

NOTE: This endpoint needs to be deployed on an independent server, not the central server.
Ask the server for a unique salt. This can only be called approximately once per hour.

Method: POST


### Parameters
| Name               | Required | Description |
| ------------------ | -------- | ----------- |
| seeds[0].seed      | Yes      | The salted hash that identifies this risk point |
| seeds[0].timestamp | Yes      | The timestamp of the risk point. If this is approx more than an hour in the past the server will throw an error. | 

e.g.
```json
{
  "seeds": [
    { "seed": "xyz", "timestamp": 1586068927222 }
  ]
}
```

## /report-analysis

NOTE: The verification of authority should be improved with an TLS challenge or a proper bearer token authentication.
Allows an Authority to report an analysis, so the user can scan it and be allowed to upload the location data

Method: POST

### Header
| Name          | Required | Description |
| --------------| -------- | ----------- |
| authorization | Yes      | Valid token stored in database |

### Parameters
| Name | Required | Description |
| -----| -------- | ----------- |
| date | Yes      | Date of the analysis result |

e.g.
```json
{
  "date": "Sat Apr 25 2020 16:29:42 GMT+0200"
}
```

Returns the UUID of the report
e.g. `8765-0831-94`


## /check-analysis-report

Check the information about the analysis report.

Method: Get

### Parameters
| Name | Required | Description |
| -----| -------- | ----------- |
| uuid | Yes      | UUID of the analysis report (stored in QR code) |

Returns an object with the analysis report data

```json
{
  "uuid": "8765-0831-94",
  "date": "2020-04-25T15:38:42.672Z",
  "used": false
}
```
