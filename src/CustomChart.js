import React from "react";
import { Chart } from "@newamerica/charts";
import HorizontalStackedBar from "./HorizontalStackedBar";
import HorizontalGroupedBar from "./HorizontalGroupedBar";
import { colorsets } from "./lib/colorsets";
import { toPng } from 'html-to-image';

export default class CustomChart extends React.Component {
  constructor(props) {
    super(props);

    this.question = this.props.question;
    this.handleFilterDemographicChange = this.handleFilterDemographicChange.bind(this);
    this.handleScreenshot = this.handleScreenshot.bind(this)
  }

  handleFilterDemographicChange(e) {
    this.props.onFilterDemographicChange(e.target.value);
  }

  download(image) {
    const downloadLink = document.createElement('a');
    const fileName = `${this.question.number_specific} ${this.props.filter_demographic}.png`;

    downloadLink.href = image;
    downloadLink.download = fileName;
    downloadLink.click();
  }

  handleScreenshot() {
    let targetElement = document.getElementById(`chart--${this.question.number_specific}`)
    let viz = document.getElementById('dashboard')
    viz.classList.add('screenshot-in-progress')
    toPng(targetElement, {
      filter: node => node.tagName != 'BUTTON',
      backgroundColor: 'white',
      pixelRatio: 3,
      height: targetElement.offsetHeight + 20,
      width: targetElement.offsetWidth + 20,
      style: {
        padding: '10px',
      },
    })
    .then((dataUrl) => this.download(dataUrl))
    .catch(function (error) {
      console.error('Screenshot download failed', error);
    })
    .then(() => viz.classList.remove('screenshot-in-progress'))
  }

  render() {
    const filter_demographic = this.props.filter_demographic;

    let data_is_filtered = filter_demographic != this.props.total_demographic;

    let demographics = this.question.demographic_keys
      .find(d => d.demographic_key == filter_demographic)
      .demographics
      .filter(d => d.demographic_total >= 50)
      .reverse();
    demographics = (data_is_filtered || (demographics.length == 0)) ? demographics.concat(this.question.total) : demographics;
    let number_of_bars = demographics.length;
    let filtered_data_unavailable = data_is_filtered && number_of_bars == 1;

    let longest_demographic = Math.max(...demographics.map(d => d.demographic_value.length))
    let longest_demographic_word = demographics.reduce((acc, cur) => Math.max(
      acc,
      ...cur.demographic_value.split(' ').map(word => word.length))
    , 0)

    let margin_left = Math.max(longest_demographic * 5, longest_demographic_word * 10)

    let keys = Object.keys(demographics[0].data)
    let chart_keys = keys

    let nonanswers = keys.filter(key => this.props.list_of_nonanswers.includes(key))
    let answers = keys.filter(key => !this.props.list_of_nonanswers.includes(key))
    let number_of_answers = answers.length;

    let colorset_name = this.question.colorset;
    let colorset_base = this.props.background_color == "grey" ? colorsets.base.on_grey : colorsets.base.on_white;
    colorset_base = colorset_base.slice(0, nonanswers.length)
    let { colorset, legend_keys, legend_colorset, chart_colorset } = [];

    if (colorset_name.includes("diverging")) {
      let index_positive_min = 0;
      let index_positive_max, index_neutral_min, index_neutral_max, index_negative_min, index_negative_max, 
          has_neutral,
          answers_neutral;

      colorset = colorset_name.includes("unordered") ? colorsets["diverging_unordered"] : colorsets["diverging"];

      if ( colorset_name.includes("neutral_center") ) {
        has_neutral = true;
        index_positive_max = (number_of_answers - 1) / 2;
        index_neutral_min  = (number_of_answers - 1) / 2;
        index_neutral_max  = (number_of_answers + 1) / 2;
        index_negative_min = (number_of_answers + 1) / 2;
        index_negative_max = number_of_answers;
      } else if ( number_of_answers % 2 == 1 ) {
        has_neutral = true;
        index_positive_max = (number_of_answers - 1) / 2;
        index_negative_min = (number_of_answers - 1) / 2;
        index_negative_max = number_of_answers - 1;
        index_neutral_min  = number_of_answers - 1;
        index_neutral_max  = number_of_answers;
      } else {
        has_neutral = false;
        legend_colorset = colorset.positive.concat(colorset.negative);
        chart_colorset  = colorset.positive.concat(colorset_base, colorset.negative);
        index_positive_max = number_of_answers / 2;
        index_negative_min = number_of_answers / 2;
        index_negative_max = number_of_answers;
      } 

      let colors_positive = colorset.positive.slice(index_positive_min, index_positive_max);
      let colors_negative = colorset.negative.slice(index_positive_min, index_positive_max).reverse();
      let answers_positive = keys.slice(index_positive_min, index_positive_max);
      let answers_negative = keys.slice(index_negative_min, index_negative_max);

      if ( !has_neutral ) {
        legend_colorset = colors_positive.concat(colors_negative);
        chart_colorset = colors_positive.concat(colorset_base, colors_negative);

        legend_keys = answers_positive.concat(answers_negative);
        chart_keys = answers_positive.concat(nonanswers, answers_negative);
      } else {
        legend_colorset = colors_positive.concat(colorset.neutral, colors_negative);
        chart_colorset = colors_positive.concat(colorset.neutral, colorset_base, colors_negative);

        answers_neutral = keys.slice(index_neutral_min, index_neutral_max);
        legend_keys = answers_positive.concat(answers_neutral, answers_negative);
        chart_keys = answers_positive.concat(answers_neutral, nonanswers, answers_negative);
      }
    } else {
      if (colorset_name.includes("scale")) {
        colorset = colorsets["scale"]
        if (colorset_name.includes("with_zero")) {
          colorset = colorsets["scale_with_zero"]
        }
      } else {
        colorset = colorset_name ? colorsets[colorset_name] : colorsets.unordered;
      }

      legend_colorset = colorset.slice(0, number_of_answers);
      if ( colorset_name.includes("decreasing")) {
        legend_colorset = legend_colorset.reverse();
      }

      chart_colorset = legend_colorset.concat(colorset_base);
      legend_keys = keys.slice(0, number_of_answers);
    } 

    let demographics_percent = demographics.map(d => 
      Object.assign(
        d,
        ...chart_keys.map(key => ({
          [key]: Math.trunc(10000 * d.data[key] / d.demographic_total) / 100
        })
      ))
    )

    return (
      <div
        id={`chart--${this.question.number_specific}`}
        className={`
          custom-chart
          ${this.props.className}
          ${!this.props.display_full_question && "custom-chart--partial-chart"}
        `}
      >
        <div className="custom-chart__meta">
          <h3 className="custom-chart__title">{this.question.content_general}</h3>
          <ul className="legend">
            {legend_keys.map((key, i) => {
              return (
                <li 
                className="legend__item"
                style={{borderColor: legend_colorset[i], backgroundColor: legend_colorset[i]}}
                >
                  {key}
                </li>
              );
            })}
          </ul>
        </div>
        {this.question.content_specific &&
          <h4 className="custom-chart__title custom-chart__title--specific">{this.question.content_specific}</h4>
        }
        {filtered_data_unavailable &&
          <p class="custom-chart__message">{this.props.meta.filtered_data_unavailable_text}</p>
        }

        {this.question.chart_type == "grouped_bar" ?
        <Chart
          maxWidth={758}
          height={(demographics.length == 1 ? 25 : 15) * number_of_bars * chart_keys.length}
          renderTooltip={tooltipData => {
          let datum = tooltipData.datum
          let data = tooltipData.data[tooltipData.index]
          return (
            <div>
              <h4 className="tooltip__title">
                {data.demographic_value} <small className="tooltip__subtitle">
                  n = {(this.props.meta.use_manual_n_sizes == "TRUE") ? data.n_size : data.demographic_total}
                </small>
              </h4>
              <table className="tooltip-table">
                {chart_keys.map((key, i) => {
                  let is_positive =  data[key] > 0;
                  return (
                    <tr 
                    className={`tooltip-table__tr ${(!is_positive && "tooltip-table__tr--zero-value")} ${(datum.key == key && "tooltip-table__tr--active")}`}
                    style={is_positive ? {borderColor: chart_colorset[i], backgroundColor: chart_colorset[i]} : {}}
                    >
                      <td className="tooltip-table__td tooltip-table__td--datum">
                        {(is_positive && data[key] < 1) 
                          ? "<1" 
                          : Math.round(data[key])}
                        %
                      </td>
                      <td className="tooltip-table__td tooltip-table__td--key">{key}</td>
                    </tr>
                  );
                })}
              </table>
            </div>
            )
          }}
        >
          {props => (
            <HorizontalGroupedBar
              questionNumber={this.question.number_specific}
              data={demographics_percent}
              y={d => d.demographic_value}
              keys={chart_keys}
              colors={chart_colorset}
              margin={{ top: data_is_filtered ? 10 : 0, left: margin_left, right: 0, bottom: 0 }}
              {...props}
            />
          )}
        </Chart>
        : <Chart
          maxWidth={758}
          height={(50 * number_of_bars) + 10}
          renderTooltip={({ datum }) => (
            <div>
              <h4 className="tooltip__title">
                {datum.bar.data.demographic_value} <small className="tooltip__subtitle">
                  n = {(this.props.meta.use_manual_n_sizes == "TRUE") ? datum.bar.data.n_size : datum.bar.data.demographic_total}
                </small>
              </h4>
              <table className="tooltip-table">
                {chart_keys.map((key, i) => {
                  let is_positive =  datum.bar.data[key] > 0;
                  return (
                    <tr 
                    className={`tooltip-table__tr ${(!is_positive && "tooltip-table__tr--zero-value")} ${(datum.key == key && "tooltip-table__tr--active")}`}
                    style={is_positive ? {borderColor: chart_colorset[i], backgroundColor: chart_colorset[i]} : {}}
                    >
                      <td className="tooltip-table__td tooltip-table__td--datum">
                        {(is_positive && datum.bar.data[key] < 1) 
                          ? "<1" 
                          : Math.round(datum.bar.data[key])}
                        %
                      </td>
                      <td className="tooltip-table__td tooltip-table__td--key">{key}</td>
                    </tr>
                  );
                })}
              </table>
            </div>
          )}
        >
          {props => (
            <HorizontalStackedBar
              questionNumber={this.question.number_specific}
              data={demographics_percent}
              y={d => d.demographic_value}
              keys={chart_keys}
              colors={chart_colorset}
              margin={{ top: data_is_filtered ? 10 : 0, left: margin_left, right: 0, bottom: 0 }}
              {...props}
            />
          )}
        </Chart>}
        <div className="custom-chart__footer">
          <small className="n-value" style={{marginLeft: margin_left}}>
            n = {this.question.total.n_size}
          </small>
          <button onClick={this.handleScreenshot} className="download-button">Download</button>
        </div>
      </div>
    );
  }
}

