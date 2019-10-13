
const assert = require('chai').assert
const WatsonToneAnalyzerAsserter = require('../src/WatsonToneAnalyzerAsserter')

const createAsserter = (tones, triggers) => {
  const args = {
    WATSONTA_APIKEY: 'testkey'
  }
  if (triggers) {
    args.WATSONTA_TONE_TRIGGERS = triggers
  }

  const asserter = new WatsonToneAnalyzerAsserter({}, {}, args)
  asserter.toneAnalyzer.tone = () => ({
    result: {
      document_tone: {
        tones
      }
    }
  })
  asserter.toneAnalyzer.toneChat = () => ({
    result: {
      utterances_tone: [
        {
          tones
        }
      ]
    }
  })
  return asserter
}

describe('asserter.config', function () {
  it('should use environment variables for configuration', async function () {
    process.env.BOTIUM_WATSONTA_APIKEY = 'myapikey'
    const asserter = createAsserter([])
    delete process.env.BOTIUM_WATSONTA_APIKEY
    assert.equal(asserter.globalArgs.WATSONTA_APIKEY, 'myapikey')
  })
})

describe('asserter.trigger', function () {
  it('should not trigger on default unmatched tone', async function () {
    const asserter = createAsserter([
      {
        score: 0.8,
        tone_id: 'polite',
        tone_name: 'Polite'
      }
    ])
    await asserter.assertConvoStep({
      convoStep: { stepTag: 'testStep' },
      args: [],
      botMsg: { messageText: 'test input' }
    })
  })
  it('should trigger on default matched tone', async function () {
    const asserter = createAsserter([
      {
        score: 0.8,
        tone_id: 'impolite',
        tone_name: 'Impolite'
      }
    ])
    try {
      await asserter.assertConvoStep({
        convoStep: { stepTag: 'testStep' },
        args: [],
        botMsg: { messageText: 'test input' }
      })
      assert.fail('should fail')
    } catch (err) {
      assert.equal(err.message, 'testStep: Identified inappropriate tone(s) in bot response: Impolite')
      assert.equal(err.context.cause.expected, 'Score for impolite, frustrated, sad < 0.75')
      assert.equal(err.context.cause.actual, 'Score for Impolite >= 0.75')
    }
  })
  it('should trigger on configured matched tone', async function () {
    const asserter = createAsserter([
      {
        score: 0.8,
        tone_id: 'mytone',
        tone_name: 'mytone'
      }
    ], ['mytone'])
    try {
      await asserter.assertConvoStep({
        convoStep: { stepTag: 'testStep' },
        args: [],
        botMsg: { messageText: 'test input' }
      })
      assert.fail('should fail')
    } catch (err) {
      assert.equal(err.message, 'testStep: Identified inappropriate tone(s) in bot response: mytone')
      assert.equal(err.context.cause.expected, 'Score for mytone < 0.75')
      assert.equal(err.context.cause.actual, 'Score for mytone >= 0.75')
    }
  })
})
