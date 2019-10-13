const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3')
const { IamAuthenticator, BasicAuthenticator } = require('ibm-watson/auth')
const _ = require('lodash')
const { BotiumError } = require('botium-core')
const debug = require('debug')('botium-asserter-watson-toneanalyzer')

const Defaults = {
  WATSONTA_URL: 'https://gateway.watsonplatform.net/tone-analyzer/api',
  WATSONTA_VERSION: '2017-09-21',
  WATSONTA_APIKEY: '',
  WATSONTA_USER: '',
  WATSONTA_PASSWORD: '',
  WATSONTA_ENDPOINT: 'toneChat',
  WATSONTA_LANGUAGE: 'en',
  WATSONTA_TONE_TRIGGERS: ['impolite', 'frustrated', 'sad'],
  WATSONTA_SCORE_TRIGGER: 0.75
}

module.exports = class WatsonToneAnalyzerAsserter {
  constructor (context, caps = {}, args = {}) {
    this.context = context
    this.caps = caps

    const myEnvs = _.mapKeys(_.pickBy(process.env, (v, k) => k.startsWith('BOTIUM_WATSONTA_')), (v, k) => k.substr(7))
    this.globalArgs = Object.assign({}, Defaults, args || {}, myEnvs)

    this.toneAnalyzer = new ToneAnalyzerV3({
      version: this.globalArgs.WATSONTA_VERSION,
      authenticator: this.globalArgs.WATSONTA_APIKEY ? new IamAuthenticator({ apikey: this.globalArgs.WATSONTA_APIKEY }) : new BasicAuthenticator({ username: this.globalArgs.WATSONTA_USER, password: this.globalArgs.WATSONTA_PASSWORD }),
      url: this.globalArgs.WATSONTA_URL,
      contentLanguage: this.globalArgs.WATSONTA_LANGUAGE
    })
  }

  getTriggerTones (tones) {
    const triggers = []
    for (const tone of tones) {
      if (this.globalArgs.WATSONTA_TONE_TRIGGERS.indexOf(tone.tone_id) >= 0 && tone.score >= this.globalArgs.WATSONTA_SCORE_TRIGGER) {
        triggers.push(tone)
      }
    }
    return triggers
  }

  async assertConvoStep ({ convoStep, args, botMsg }) {
    let analyzeText = botMsg.messageText
    if (args && args.length > 0) {
      analyzeText = args[0]
    }
    if (!analyzeText) return

    let triggers = []

    if (this.globalArgs.WATSONTA_ENDPOINT === 'toneChat') {
      const toneChatParams = {
        utterances: [
          {
            text: analyzeText,
            user: 'agent'
          }
        ]
      }
      const utteranceAnalysis = await this.toneAnalyzer.toneChat(toneChatParams)
      debug(`Analyzing toneChatParams: ${JSON.stringify(toneChatParams)} => ${JSON.stringify(utteranceAnalysis.result)}`)
      if (utteranceAnalysis.result && utteranceAnalysis.result.utterances_tone && utteranceAnalysis.result.utterances_tone.length > 0) {
        const toneResult = utteranceAnalysis.result.utterances_tone[0]
        if (toneResult.tones && toneResult.tones.length > 0) {
          triggers = this.getTriggerTones(toneResult.tones)
        }
      }
    } else if (this.globalArgs.WATSONTA_ENDPOINT === 'tone') {
      const toneParams = {
        toneInput: analyzeText,
        contentType: 'text/plain'
      }
      const toneAnalysis = await this.toneAnalyzer.tone(toneParams)
      debug(`Analyzing toneParams: ${JSON.stringify(toneParams)} => ${JSON.stringify(toneAnalysis.result)}`)
      if (toneAnalysis.result && toneAnalysis.result.document_tone) {
        const toneResult = toneAnalysis.result.document_tone
        if (toneResult.tones && toneResult.tones.length > 0) {
          triggers = this.getTriggerTones(toneResult.tones)
        }
      }
    }

    if (triggers && triggers.length > 0) {
      throw new BotiumError(`${convoStep.stepTag}: Identified inappropriate tone(s) in bot response: ${triggers.map(t => t.tone_name).join(', ')}`,
        {
          type: 'asserter',
          source: 'WatsonToneAnalyzerAsserter',
          context: {
            params: {
              args
            },
            globalArgs: this.globalArgs
          },
          cause: {
            expected: `Score for ${this.globalArgs.WATSONTA_TONE_TRIGGERS.join(', ')} < ${this.globalArgs.WATSONTA_SCORE_TRIGGER}`,
            actual: `Score for ${triggers.map(t => t.tone_name).join(', ')} >= ${this.globalArgs.WATSONTA_SCORE_TRIGGER}`,
            diff: triggers
          }
        }
      )
    }
  }
}
