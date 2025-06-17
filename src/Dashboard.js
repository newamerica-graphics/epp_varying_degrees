import React from "react";
import ButtonGroup from "./ButtonGroup";
import { ChartContainer } from "@newamerica/meta";
import CustomChart from "./CustomChart";

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter_demographic: this.props.total_demographic,
      filter_finding: this.props.initial_finding,
      filter_question: this.props.initial_question || null,
    };

    this.handleFilterDemographicChange = this.handleFilterDemographicChange.bind(this);
    this.handleFilterFindingChange = this.handleFilterFindingChange.bind(this);
    this.handleFilterQuestionChange = this.handleFilterQuestionChange.bind(this);

    this.data = this.props.data;
    this.demographics = this.props.data.demographic_keys.filter(d => !d.skip_demographic_key)
    this.finding_questions = this.props.data.finding_questions
  }

  componentDidMount() {
    this.props.initial_question && document.getElementById(`chart--${this.props.initial_question}`).scrollIntoView()
  }
  
  handleFilterDemographicChange(demographic) {
    this.setState({filter_demographic: demographic})
  }
  
  handleFilterFindingChange(finding) {
    this.setState({
      filter_finding: finding,
      filter_question: null // reset question filter when finding changes
    })
  }
  
  handleFilterQuestionChange(question) {
    this.setState({filter_question: question.target.value})
  }
  
  render() {
    let meta = this.data.meta.filter(col => !this.data.meta[2][col])[0]
    let finding_questions = this.finding_questions
      .filter(d => d.finding == this.state.filter_finding)
      .map(q => q.question_number);
    let previous_question;

    window.addEventListener("message", (function (a) { if (void 0 !== a.data["datawrapper-height"]) for (var e in a.data["datawrapper-height"]) { var t = document.getElementById("datawrapper-chart-" + e) || document.querySelector("iframe[src*='" + e + "']"); t && (t.style.height = a.data["datawrapper-height"][e] + "px") } }))

    return (
      <ChartContainer className="dv-dashboard">
        <nav className="dv-dashboard__column dv-dashboard__column--nav">
          <h2 className="dv-dashboard__nav-title">{meta.dashboard_title}</h2>
          {/* <h4 className="dv-dashboard__nav-heading">{meta.findings_heading}</h4> */}
          <ButtonGroup
            onChange={this.handleFilterFindingChange}
            options={this.props.data.findings.map(d => ({id: d.finding_short, text: d.finding_title}))}
            active={this.state.filter_finding}
            className="dv-button-group--findings"
            style="ol"
          />
          
          <h4 className="dv-dashboard__nav-heading">Select question</h4>
          {/* question filter dropdown */}
          <div className="dv-dashboard__question-filter">
            <select 
              className="dv-select"
              onChange={this.handleFilterQuestionChange}
              value={this.state.filter_question || ""}
            >
              <option value="">All Questions</option>
              {(() => {
                // get all questions for the current finding
                const filteredQuestions = this.props.questions
                  .filter(q => finding_questions.includes(q.number_specific));
                
                // group questions by their prefix (e.g., "3" for "3A", "3B", etc.)
                const questionGroups = {};
                filteredQuestions.forEach(q => {
                  // extract question prefix (e.g., "3" from "3A", "60" from "60A")
                  // match numeric part of prefix up to the first non-numeric character
                  const match = q.number_specific.match(/^(\d+)/);
                  const prefix = match ? match[1] : q.number_specific;
                  
                  if (!questionGroups[prefix]) {
                    questionGroups[prefix] = {
                      prefix: prefix,
                      questions: [],
                      // use first question's content as group title -- some cases where there are multiple dif ones
                      content: q.content_general
                    };
                  }
                  questionGroups[prefix].questions.push(q);
                });
                
                // convert question groups object to an array and sort by prefix
                return Object.values(questionGroups)
                  .sort((a, b) => a.prefix.localeCompare(b.prefix, undefined, {numeric: true}))
                  .map(group => {
                    // format dropdown options as: question number - first 80 chars of question title
                    const questionText = group.content.substring(0, 80) + 
                      (group.content.length > 80 ? "..." : "");
                    
                    return (
                      <option key={group.prefix} value={group.prefix}>
                        {group.prefix} - {questionText}
                      </option>
                    );
                  });
              })()}
            </select>
          </div>
          
          {/* <h4 className="dv-dashboard__nav-heading">Show breakdown by...</h4> */}
          <h4 className="dv-dashboard__nav-heading">{meta.filter_heading}</h4>
          <ButtonGroup
            onChange={this.handleFilterDemographicChange}
            options={this.demographics.map(d => ({ id: d.demographic_key, text: d.demographic_key }))}
            active={this.demographics[0].demographic_key}
            className="dv-button-group--filters"
          />
        </nav>
        <div className="dv-dashboard__column dv-dashboard__column--data">
          
          {/* <h2>{selected_finding.finding_title}</h2> */}
          {this.props.questions.map((q) => {
            if(!finding_questions.includes(q.number_specific)) return;
            
            //if a question filter is selected, only show questions w exact prefix
            if(this.state.filter_question) {
              // extract numeric prefix from current question
              const match = q.number_specific.match(/^(\d+)/);
              const prefix = match ? match[1] : q.number_specific;
              
              // only show questions w exact prefix
              if(prefix !== this.state.filter_question) return;
            }

            let is_new_question = q.content_general != previous_question;
            previous_question = q.content_general;

            if (q.datawrapper_code) {
              return(
                <div className={`datawrapper-chart ${!is_new_question && "custom-chart--partial-chart"}`}>
                  {is_new_question && 
                    <h3 className="custom-chart__title">{q.content_general}</h3>
                  }
                  {q.content_specific && 
                    <h4 className="custom-chart__title custom-chart__title--specific">{q.content_specific}</h4>
                  }
                  {this.state.filter_demographic != this.props.total_demographic
                    ?
                    <p class="custom-chart__message">{meta.filtered_data_unavailable_text}</p>
                    :
                    <div>
                      <iframe aria-label="Chart" id={`datawrapper-chart-${q.datawrapper_code}`} src={`https://datawrapper.dwcdn.net/${q.datawrapper_code}/`} scrolling="no" frameborder="0" style={{width: 0, minWidth: "100%", border: "none"}} height="800"></iframe>
                      <small className="n-value">
                        n = {q.n_size}
                      </small>
                    </div>
                  }
                </div>
              );
            }

            return (
              <CustomChart
                question={q}
                meta={meta}
                display_full_question={is_new_question}
                filter_demographic={this.state.filter_demographic}
                total_demographic={this.props.total_demographic}
                onFilterDemographicChange={this.handleFilterDemographicChange}
                list_of_nonanswers = {this.data.meta.filter(e => e.list_of_nonanswers).map(e => e.list_of_nonanswers)}
              />
            )
          })}
        </div>
      </ChartContainer>
    );
  }
}
