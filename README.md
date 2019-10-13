# Botium Tone Analyzer Asserter

[![NPM](https://nodei.co/npm/botium-asserter-watson-toneanalyzer.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-asserter-watson-toneanalyzer/)

[![Codeship Status for codeforequity-at/botium-asserter-watson-toneanalyzer](https://app.codeship.com/projects/f89bd380-cfc2-0137-830b-02b9098a259a/status?branch=master)](https://app.codeship.com/projects/369177)
[![npm version](https://badge.fury.io/js/botium-asserter-watson-toneanalyzer.svg)](https://badge.fury.io/js/botium-asserter-watson-toneanalyzer)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) asserter for analyzing and verifying the tone of a chatbot. This asserter uses the [Watson Tone Analyzer](https://www.ibm.com/watson/services/tone-analyzer/) to retrieve the sentiment of the bot response and trigger an assertion failure if given sentiments are matched (_impolite_, _anger_, ...).

## Configuration

You have to activate the [Tone Analzer](https://www.ibm.com/watson/services/tone-analyzer/) in your IBM Cloud account, the URL and the credentials are shown on the _Manage_ view.

Configuration of the asserter is done with the args properties (see below).

_You can provide and overwrite each of this asserter args with an environment variable starting with BOTIUM\_arg-name - for example, to provide the IBM Cloud API Key as environment variable instead of asserter arg, use the environment variable BOTIUM\_WATSONTA\_APIKEY_


### WATSONTA_URL
_Default: https://gateway.watsonplatform.net/tone-analyzer/api_

URL of your Watson Tone Analyzer instance

### WATSONTA_APIKEY / WATSONTA_USER / WATSONTA_PASSWORD
Depending on your IBM Cloud account, you have either API Key credentials or Username/Password credentials. 

_The credentials are different than the credentials your are using for logging into the IBM Cloud console_

### WATSONTA_VERSION
_Default: 2017-09-21_

### WATSONTA_ENDPOINT
_Default: toneChat_

Either _toneChat_ or _tone_

The Watson Tone Analyzer supports two different tone analyzer modes, one for general tone analysis, one for customer engagement tone analysis, see [here](https://cloud.ibm.com/apidocs/tone-analyzer).

### WATSONTA_LANGUAGE
_Default: en_

Content language. For list of supported languages, see [here](https://cloud.ibm.com/apidocs/tone-analyzer).

### WATSONTA_TONE_TRIGGERS
_Default: ['impolite', 'frustrated', 'sad']_

JSON Array of tones. If any of these tones is identified with high likelihood (see WATSONTA_SCORE_TRIGGER) in the bot response, the test case will fail.

Depending on the WATSONTA_ENDPOINT configured, there are different tones available - see the _tone\_id_ fields in the [API Docs](https://cloud.ibm.com/apidocs/tone-analyzer)

### WATSONTA_SCORE_TRIGGER
_Default: 0.75_

Minimum likelihood to trigger a tone match.

## Installation

### Botium Box

Deploy the NPM package to Botium Box
* Download this package [as ZIP file](https://github.com/codeforequity-at/botium-asserter-watson-toneanalyzer/archive/master.zip)
* Follow [these](https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/2293815/Botium+Asserters) instructions to register in Botium Box
* Use the _Component Configuration_ field to add configuration args (see below):
```
{
  "WATSONTA_URL": "...",
  "WATSONTA_APIKEY": "..."
}
```
* Suggestions:
    * Use **TONEANALYZER** as _Component Ref Code_
    * Use **Register as global scripting component** to make it a **global** asserter in all test cases

### Botium Core / Botium Bindings / Botium CLI

Install asserter NPM package:

    npm install --save botium-asserter-watson-toneanalyzer

Add to botium.json - in this case, it is added as a **global** asserter running it on all responses. This is the suggested use case.

```
{
  "botium": {
    "Capabilities": {
      ...
      "ASSERTERS": [
        {
          "ref": "TONEANALYZER",
          "src": "botium-asserter-watson-toneanalyzer",
          "global": true,
          "args": {
            "WATSONTA_URL": "...",
            "WATSONTA_APIKEY": "..."
          }          
        }
      ]
    }
  }
}
```

## Usage
If asserter is configured as **global**, assertions are done on all bot responses.

Otherwise, you can trigger the assertions by adding it to your convo file:

```
#me
hey how are you

#bot
TONEANALYZER
```
