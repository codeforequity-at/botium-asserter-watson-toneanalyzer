# Botium Asserter with Watson Tone Analyzer

Asserts Botium Message contains a hyperlink

## Configuration

Tone Analzer auf IBM Cloud erstellen
URL + auth key auf Manage / Credentials


  url: 'https://gateway.watsonplatform.net/tone-analyzer/api',
  version: '2017-09-21',
  apiKey: '',
  user: '',
  password: '',
  endpoint: 'toneChat' oder 'tone'

 [excited,frustrated,impolite,polite,sad,satisfied,sympathetic]


### Botium Box

Preconfigured in Botium Box with *HASLINK* reference code.

See https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/2293815/Botium+Asserters

### Botium Core / Botium Bindings / Botium CLI

    npm install --save botium-asserter-basiclink

Add to ASSERTERS capability, see [sample](https://github.com/codeforequity-at/botium-asserter-basiclink/blob/master/samples/botium.json)

## Usage

```
#me
Give me some links

#bot
HASLINK www.google.com
```

