import React from "react";
import ReactDOM from "react-dom";
import Dashboard from "./Dashboard";
import './index.scss';

let queue = [];
let data = null;

const settings = {
  'test': el => {
    ReactDOM.render(
      [
        <Dashboard
          data={data}
        />
      ],
      el
    )
  }
};

fetch('https://na-data-sheetsstorm.s3.us-west-2.amazonaws.com/prod/epp/varying_degrees_2019.json').then(response => response.json()).then((_data)=>{
  data = _data;
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
