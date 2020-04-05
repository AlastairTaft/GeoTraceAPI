# What is it?
An API to privately store the location data for COVID-19 diagnosed cases in Tasmania. And improve the ability to contact trace. It stores location data from people that are both diagnosed and not diagnoses with COVID-19. For the simple ability that contacts can be immediately notifified if they have historically crossed paths with a newly diagnosed case.

All data points stored contain no personal information. The only identifying characteristic is an unguessable hashed ID that is only known to the user that hashed it and perhaps a push notification token that allows the server to send notifications to the user.

# Why
This repo was forked from [here](https://github.com/AlastairTaft/track-covid-19-spread). The concept there was to make diagnosed people's location history publically accessible when given freely by the individual. However the location data here is collected in the background from an app so it does not feel acceptible to treat this data in the same and as such the data is private by default. Also both data from non infected cases and infected cases are tracked to make contact tracing more rapid, therefor it is all private by default.s

# API 

## /location-history

Get location data for COVID-19 patients.

Method: GET

### Parameters
| Name       | Required | Description |
| ---------- | -------- | ----------- |
| geo-within | No       | A valid [Geo JSON geometry object](https://tools.ietf.org/html/rfc7946#section-3.1) |
| uniqueId   | Yes      | The unique reference id identifiying the user. |
| skip       | No       | An integer, skip the first n records | 
| limit      | No       | Get up to this many records back, max limit is 500 | 
| from       | No       | Get records after this EPOCH. |
| to         | No       | Get records before this EPOCH. |
| at-risk    | No       | Only returns records that are marked as at risk. i.e. have come in close proximity to a COVID-19 positive person. |

Returns a [Geo JSON FeatureCollection](https://tools.ietf.org/html/rfc7946#section-3.3) Sorted by feature timestamp in descending order.

Example url path.
```
/location-history?uniqueId=test&geo-within=%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B100%2C-20%5D%2C%5B110%2C-20%5D%2C%5B110%2C-30%5D%2C%5B100%2C-30%5D%2C%5B100%2C-20%5D%5D%5D%7D

## /submit-location-history

Submit location history. All location history must be stored as a [GeoJSON Feature Collection](https://tools.ietf.org/html/rfc7946#section-3.3).

Method: POST

### Parameters
| Name     | Required | Description |
| -------- | -------- | ----------- |
| type     | Yes      | Accepts only a value of "FeatureCollection" |
| features | Yes      | An array of [Geo JSON Feature](https://tools.ietf.org/html/rfc7946#section-3.2) records | 

#### Properties
Values that can be populated on the Feature properties object.

| Name      | Type    | Required | Description |
| ----      | ------- | -------- | ----------- |
| infected  | Boolean | No       | True if the person this location history is linked to has COVID-19 |
| timestamp | Integer | Yes      | The timestamp of location point. |
| uniqueId  | String  | Yes      | The, unguessable, unique id only known by the reporting user. |

e.g.
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          50.123,
          51.321,
          0
        ]
      }
    }
  ]
}
```

## report-infected

Report the user is diagnosed with COVID-19.

Method: PUT

### Parameters
| Name                       | Type    | Required | Description |
| -------------------------- | ------- | -------- | ----------- |
| uniqueId                  | String  | Yes      | The uniqueId identifying the user. |
| timestamp-showing-symptoms | Integer | Yes      | At what point did the user start seeing symptoms. a UNIX Epoch. |

e.g.

```json
{
  "uniqueId": "xyz123",
  "timestampShowingSymptoms": 1586068927222
}
```

## status

Get the user status, i.e. whether or not they are infected.

Method: Get

### Parameters
| Name     | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| uniqueId | String  | Yes      | The uniqueId identifying the user. |

Returns an object with the prop 'infected', e.g.

```json
{
  "infected": false
}
```
