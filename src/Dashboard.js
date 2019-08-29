import React from "react";
import { ButtonGroup, Select } from "@newamerica/components";
import { ChartContainer } from "@newamerica/meta";
import CustomChart from "./CustomChart";

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter_demographic: 'Total',
      filter_finding: 'jobs',
    };

    this.handleFilterDemographicChange = this.handleFilterDemographicChange.bind(this);
    this.handleFilterFindingChange = this.handleFilterFindingChange.bind(this);

    this.data = this.props.data;
    this.meta = this.data.meta[0];
    this.questions = this.props.questions;
    this.comparison_demographic = this.props.comparison_demographic;
    this.total_demographic = this.props.total_demographic;
    this.filtered_data_unavailable_text = this.props.filtered_data_unavailable_text;
    this.filter_heading = this.meta.filter_heading;
    this.findings_heading = this.meta.findings_heading;
  }

  handleFilterDemographicChange(demographic) {
    this.setState({filter_demographic: demographic})
  }

  handleFilterFindingChange(finding) {
    this.setState({filter_finding: finding})
  }

  render() {
    let selected_finding = this.props.data.findings.find(d => d.finding_short == this.state.filter_finding);
    let finding_questions = this.props.data.finding_questions
      .filter(d => d.finding == this.state.filter_finding)
      .map(finding_question => finding_question.question_number);
    let last_question;
      
    return (
      <ChartContainer className="dv-chart">
        <div className="dv-chart__column">
          <nav className="dashboard-nav">
            <label>
              <h4 className="dashboard-nav__heading dashboard-nav__heading--first">{this.filter_heading}</h4>
            </label>
            <Select
              onChange={this.handleFilterDemographicChange}
              options={this.props.data.demographic_keys.map(d => d.demographic_key)}
              className="dashboard-nav__select"
            />
            <h4 className="dashboard-nav__heading">{this.findings_heading}</h4>
            <ButtonGroup
              onChange={this.handleFilterFindingChange}
              options={this.props.data.findings.map(d => ({id: d.finding_short, text: d.finding_title}))}
              active={this.props.data.findings[0].finding_short}
            />
          </nav>
        </div>
        <div className="dv-chart__column">
          <h2>{selected_finding.finding_title}</h2>
          {this.questions.map((q) => {
            let is_new_question = q.content_general != last_question;
            last_question = q.content_general; 

            return (
              <div>
                {(finding_questions.includes(q.question_number) || finding_questions.includes(q.question_specific)) && 
                  <CustomChart
                    question={q}
                    display_full_question={is_new_question}
                    filter_demographic={this.state.filter_demographic}
                    total_demographic={this.total_demographic}
                    filtered_data_unavailable_text={this.filtered_data_unavailable_text}
                    onFilterDemographicChange={this.handleFilterDemographicChange}
                  />
                }
              </div>
            )
          })}
        </div>
      </ChartContainer>
    );
  }
}