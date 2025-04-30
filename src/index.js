import React from "react";
import ReactDOM from "react-dom";
import Dashboard from "./Dashboard";
import IndividualChart from "./IndividualChart";
import './index.sass';

let queue = [];
let data = null;
let comparison_demographic = null;
let total_demographic = null;
let search_params = new URLSearchParams(location.search)
let initial_finding = search_params.get('finding');
let initial_question = initial_finding ? search_params.get('question') : null
// let filtered_data_unavailable_text = null;
// let list_of_nonanswers = [];
let questions = null;
let finding_question_numbers;

// const numberOfCharts = 200;

const settings = Object.assign(
  {
    'dashboard': el => {
      ReactDOM.render(
        [
          <Dashboard
            data={data}
            questions={questions}
            total_demographic={total_demographic}
            initial_finding={initial_finding}
            initial_question={initial_question}
          />
        ],
        el
      )
    },
  },
  // ...Array.from({ length: numberOfCharts }, (_, i) => ({
  //   [`chart__${i+1}`]: el => {
  //     ReactDOM.render(
  //       [
  //         <IndividualChart
  //           questions={questions.filter(d => d.number_general == data.individual_charts[i].question || d.number_specific == data.individual_charts[i].question)}
  //           filter_demographic={data.individual_charts[i].demographic_key}
  //           total_demographic={total_demographic}
  //           filtered_data_unavailable_text={filtered_data_unavailable_text}
  //           list_of_nonanswers={list_of_nonanswers}
  //         />
  //       ],
  //       el
  //     )
  //   }
  // }))
);

// fetch('https://na-data-sheetsstorm.s3.us-west-2.amazonaws.com/prod/epp/varying_degrees_2024.json').then(response => response.json()).then((_data)=>{
fetch('/src/lib/data/varying_degrees_2024.json').then(response => response.json()).then((_data)=>{
  data = _data;
  comparison_demographic = data.meta[0].comparison_demographic;
  total_demographic = data.meta[0].demographic_key_for_total;
  // filtered_data_unavailable_text = data.meta[0].filtered_data_unavailable_text;
  // list_of_nonanswers = data.meta.filter(e => e.list_of_nonanswers).map(e => e.list_of_nonanswers);
  finding_question_numbers = data.finding_questions.map(q => q.question_number);
  initial_finding = initial_finding || data.findings[0].finding_short
  questions = data.questions.filter(q => 
    finding_question_numbers.includes(q.number_specific)
  ).map(q => {
    let q_data = data.data.filter(d => 
      d["Q Number"] == q.number_specific 
    );
  return ({
    number_specific: q.number_specific,
    content_general: q.content_general,
    content_specific: q.content_specific,
    colorset: q.colorset,
    chart_type: q.chart_type,
    datawrapper_code: q.datawrapper_code,
    total: {
      demographic_value: "Total",
      demographic_total: Object.keys(q_data).reduce((acc, cur) =>
        acc + (Number(q_data[cur][comparison_demographic]) > 0 ? Number(q_data[cur][comparison_demographic]) : 0)
      , 0),
      n_size: data.n_sizes.filter(row => row.number_specific == q.number_specific)[0][comparison_demographic],
      data: Object.assign(...q_data.map(row => ({
        [row["Responses"]]: row[comparison_demographic]
      }))),
    },
    demographic_keys: [...data.demographic_keys.map(key => {
      let demographic_values = data.demographic_values.filter(d => d.demographic_key == key.demographic_key);
      let response_data = q_data.map(row => Object.assign(...Object.keys(row)
        .filter(k => demographic_values.map(d => d.demographic_full).includes(k) || k == "Responses")
        .map(k => ({[k]: row[k]}))
      ));
      return ({
        demographic_key: key.demographic_key,
        demographics: [...demographic_values.map(demographic => ({
          demographic_value: demographic.demographic_value,
          demographic_total: Object.keys(response_data).filter(k => k != "Responses").reduce((acc, cur) =>
            acc + (Number(response_data[cur][demographic.demographic_full]) > 0 ? Number(response_data[cur][demographic.demographic_full]) : 0)
          , 0),
          n_size: data.n_sizes.filter(row => row.number_specific == q.number_specific)[0][demographic.demographic_full],
          data: Object.assign(...response_data.map(row => ({
            [row["Responses"]]: row[demographic.demographic_full]
          }))),
        }))],
      })
    })],
  })
});
for(let i=0; i<queue.length; i++)
  queue[i]();
});

window.renderDataViz = function(el){
  let id = el.getAttribute('id');
  let chart = settings[id];
  if(!chart) return;

  if(data){
    chart(el);
  } else {
    queue.push(() => chart(el));
  }
}


/*
This is the format for the new questions data object:
{
  Question-level information (question number and text)
  ...
  ...
  total: { // this is for comparison
    demographic_value: "Total",
    demographic_total: "5023",
    data: [
      "Much more": "2%", // "Response" for the first value
      "Somewhat": "5%",  // same as the previous, for an arbitrary number of responses
      ...
    ],
  },
  demographic_keys: [
    {
      demographic_key: "Total",
      demographics: [
        demographic_value: "2018",
        demographic_total: 5023,
        data: [
          "Much more": "2%", // "Response" for the first value
          "Somewhat": "5%",  // same as the previous, for an arbitrary number of responses
          ...
        ],
      ],
    },
    ...
  ]
},
...
*/