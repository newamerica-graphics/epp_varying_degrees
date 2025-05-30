import React from "react";
import PropTypes from "prop-types";
import { BarGroupHorizontal } from "@vx/shape";
import { Group } from "@vx/group";
import { AxisLeft } from "@vx/axis";
import { scaleBand, scaleLinear, scaleOrdinal } from "@vx/scale";
import { GridColumns } from "@vx/grid";
import { Text } from "@vx/text";
import { max } from "d3-array";

const HorizontalGroupedBar = ({
  width,
  height,
  handleMouseMove,
  handleMouseLeave,
  data,
  y,
  keys,
  yFormat,
  yAxisLabel,
  colors,
  margin,
  questionNumber
}) => {
  const xMax = width - margin.left - margin.right;
  const xMaxBars = xMax - 38; // leave room for the biggest label to be "100%"
  const yMax = height - margin.top - margin.bottom;

  const colorScale = scaleOrdinal({
    domain: keys,
    range: colors
  });
  const y0Scale = scaleBand({
    rangeRound: [yMax, 0],
    domain: data.map(y),
    padding: 0.01
  });
  const y1Scale = scaleBand({
    rangeRound: [0, y0Scale.bandwidth()],
    domain: keys,
    padding: 0
  });
  const xScale = scaleLinear({
    rangeRound: [xMaxBars, 0],
    domain: [0, max(data, d => max(keys, key => d[key]))]
  });

  return (
    <Group top={margin.top} left={margin.left}>
      {/* <GridColumns
        scale={xScale}
        height={yMax}
        top={0}
        tickValues={[25, 75]}
        stroke="#ABACAE"
        />
      <GridColumns
        scale={xScale}
        height={yMax}
        top={0}
        tickValues={[50]}
        lineStyle={{strokeOpacity: "0.5"}}
        stroke="#333"
        strokeWidth="2px"
      /> */}
      <Group className="bars">
        <BarGroupHorizontal
          data={data}
          keys={keys}
          width={xMaxBars}
          y0={y}
          y0Scale={y0Scale}
          y1Scale={y1Scale}
          xScale={xScale}
          color={colorScale}
        >
          {barGroups => {
            return barGroups.map(barGroup => {
              return (
                <Group
                  className="bar-group"
                  key={`bar-group-${barGroup.index}-${barGroup.y0}`}
                  top={barGroup.y0}
                >
                  <line
                    x1={-0.5}
                    x2={-0.5}
                    y1={2}
                    y2={y0Scale.bandwidth() - 2}
                    style={{
                      stroke: "#ABACAE",
                      strokeWidth: 1
                    }}
                  />
                  {barGroup.bars.map(bar => {
                    return (
                      <Group
                        className={`
                          bar
                          bar--key-${bar.index}
                          bar--color-${bar.color.slice(1)}
                        `}
                        key={`bar-group-bar-${barGroup.index}-${bar.index}-${bar.value}-${bar.key}`}
                        onMouseMove={event => {
                          handleMouseMove ? (handleMouseMove({ event, data, datum: bar, index: barGroup.index })) : null
                          Array.from(document.getElementsByClassName(`bar--key-${bar.index}`)).forEach(e => e.classList.add("bar--key-hover"))
                        }}
                        onMouseLeave={e => {
                          handleMouseLeave ? handleMouseLeave() : null
                          Array.from(document.getElementsByClassName(`bar--key-${bar.index}`)).forEach(e => e.classList.remove("bar--key-hover"))
                        }}
                      >
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={xMax}
                          height={bar.height}
                          fill="transparent"
                        />
                        <rect
                          className="bar__rectangle"
                          clip-path={`url(#clip-${questionNumber}-${barGroup.index}-${bar.index})`}
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          fill={bar.color}
                          stroke={bar.color}
                          strokeWidth="4"
                        />
                        <clipPath id={`clip-${questionNumber}-${barGroup.index}-${bar.index}`}>
                          <rect
                            x={bar.x}
                            y={bar.y}
                            width={bar.width}
                            height={bar.height}
                          />
                        </clipPath>
                        <Text
                          x={bar.x + bar.width + 3}
                          y={bar.y + 0.5 * bar.height}
                          className="bar__text bar__text--outside"
                          verticalAnchor="middle"
                        >
                          {(bar.value < 1 && bar.value > 0) ? `<1%` : `${Math.round(bar.value)}%`}
                        </Text>
                      </Group>
                    );
                  })}
                </Group>
              );
            });
          }}
        </BarGroupHorizontal>
      </Group>
      <AxisLeft
        scale={y0Scale}
        label={yAxisLabel}
        hideAxisLine={true}
        hideTicks={true}
        tickFormat={yFormat}
        tickLabelProps={(d) => ({
          height: y0Scale.bandwidth(),
          width: margin.left,
          textAnchor: "end",
          verticalAnchor: "middle",
          fontSize: 14,
          fontWeight: (d == "2025" || d == "Total") && "bold", // TODO don't hard-code this text
        })}
        labelProps={{
          textAnchor: "middle",
          verticalAnchor: "end"
        }}
      />
    </Group>
  );
};

HorizontalGroupedBar.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  handleMouseMove: PropTypes.func,
  handleMouseLeave: PropTypes.func,
  tooltipOpen: PropTypes.bool,
  data: PropTypes.array.isRequired,
  /**
   * Accessor function for y axis values
   */
  y: PropTypes.func.isRequired,
  /**
   * An array of strings with the keys for each bar
   */
  keys: PropTypes.array.isRequired,
  xFormat: PropTypes.func,
  yFormat: PropTypes.func,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  numTicksX: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  colors: PropTypes.array.isRequired,
  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
  })
};

HorizontalGroupedBar.defaultProps = {
  numTicksX: 5,
  margin: {
    top: 40,
    left: 40,
    right: 40,
    bottom: 40
  }
};

export default HorizontalGroupedBar;
