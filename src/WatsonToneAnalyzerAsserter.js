const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3')
const { IamAuthenticator, BasicAuthenticator } = require('ibm-watson/auth')
const { BotiumError } = require('botium-core')
const debug = require('debug')('botium-asserter-watson-toneanalyzer')

const Defaults = {
  WATSON_URL: 'https://gateway.watsonplatform.net/tone-analyzer/api',
  WATSON_VERSION: '2017-09-21',
  WATSON_APIKEY: '',
  WATSON_USER: '',
  WATSON_PASSWORD: '',
  WATSON_ENDPOINT: 'toneChat',
  WATSON_LANGUAGE: 'en',
  WATSON_TONE_TRIGGERS: ['impolite', 'frustrated', 'sad'],
  WATSON_SCORE_TRIGGER: 0.75
}

module.exports = class WatsonToneAnalyzerAsserter {
  constructor (context, caps = {}, args = {}) {
    this.context = context
    this.caps = caps
    this.globalArgs = Object.assign({}, Defaults, args || {})
  }

  getTriggerTones (tones) {
    const triggers = []
    for (const tone of tones) {
      if (this.globalArgs.WATSON_TONE_TRIGGERS.indexOf(tone.tone_id) >= 0 && tone.score >= this.globalArgs.WATSON_SCORE_TRIGGER) {
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

    const toneAnalyzer = new ToneAnalyzerV3({
      version: this.globalArgs.WATSON_VERSION,
      authenticator: this.globalArgs.WATSON_APIKEY ? new IamAuthenticator({ apikey: this.globalArgs.WATSON_APIKEY }) : new BasicAuthenticator({ username: this.globalArgs.WATSON_USER, password: this.globalArgs.WATSON_PASSWORD }),
      url: this.globalArgs.WATSON_URL,
      contentLanguage: this.globalArgs.WATSON_LANGUAGE
    })

    let triggers = []

    if (this.globalArgs.WATSON_ENDPOINT === 'toneChat') {
      const toneChatParams = {
        utterances: [
          {
            text: analyzeText,
            user: 'agent'
          }
        ]
      }
      const utteranceAnalysis = await toneAnalyzer.toneChat(toneChatParams)
      debug(`Analyzing toneChatParams: ${JSON.stringify(toneChatParams)} => ${JSON.stringify(utteranceAnalysis.result)}`)
      if (utteranceAnalysis.result && utteranceAnalysis.result.utterances_tone && utteranceAnalysis.result.utterances_tone.length > 0) {
        const toneResult = utteranceAnalysis.result.utterances_tone[0]
        if (toneResult.tones && toneResult.tones.length > 0) {
          triggers = this.getTriggerTones(toneResult.tones)
        }
      }
    } else if (this.globalArgs.WATSON_ENDPOINT === 'tone') {
      const toneParams = {
        toneInput: analyzeText,
        contentType: 'text/plain'
      }
      const toneAnalysis = await toneAnalyzer.tone(toneParams)
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
            expected: `Score for ${this.globalArgs.WATSON_TONE_TRIGGERS.join(', ')} < ${this.globalArgs.WATSON_SCORE_TRIGGER}`,
            actual: `Score for ${triggers.map(t => t.tone_name).join(', ')} >= ${this.globalArgs.WATSON_SCORE_TRIGGER}`,
            diff: triggers
          }
        }
      )
    }
  }
}
