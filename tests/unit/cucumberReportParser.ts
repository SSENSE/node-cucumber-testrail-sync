import { expect } from 'chai'
import { CucumberReportParser, Scenario } from '../../src/index'
import * as reportmock from './cucumberReportFiles-fixtures'

describe('Test cucumber report parser', () => {
  it('return scenario when report file is ok', (done: Function) => {
    const parser = new CucumberReportParser()
    let result = parser.parseReport(reportmock.fixtures.good)
    expect(Object.keys(result)).to.have.lengthOf(1)
    expect(result[0].isSuccessful).to.be.true
    expect(result[0].exception).to.be.null
    expect(result[0]).to.have.property('tags')
    expect(result[0]).to.have.property('isSuccessful')
    expect(result[0].tags[0]).to.equal('@tcid:77980')
    done()
  })

  it('return nothing when report file has no elements empty', (done: Function) => {
    const parser = new CucumberReportParser()
    let result = parser.parseReport(reportmock.fixtures.emptyElements)
    expect(Object.keys(result)).to.have.lengthOf(0)
    done()
  })

  it('return nothing when report file is empty', (done: Function) => {
    const parser = new CucumberReportParser()
    let result = parser.parseReport(reportmock.fixtures.empty)
    expect(Object.keys(result)).to.have.lengthOf(0)
    done()
  })

  it('return nothing when report file has wrong format', (done: Function) => {
    const parser = new CucumberReportParser()
    let result = parser.parseReport(reportmock.fixtures.errorOnLastStep)
    expect(Object.keys(result)).to.have.lengthOf(1)
    expect(result[0].isSuccessful).to.be.false
    expect(result[0].exception).to.be.equal(
      `status[failed] step[I see the News Line]`
    )
    expect(result[0]).to.have.property('tags')
    expect(result[0]).to.have.property('isSuccessful')
    expect(result[0].tags[0]).to.equal('@tcid:77980')
    done()
  })
})
