import React from "react";
import PropTypes from "prop-types";
import { BarStackHorizontal } from "@vx/shape";
import { Group } from "@vx/group";
import { AxisLeft } from "@vx/axis";
import { scaleBand, scaleLinear, scaleOrdinal } from "@vx/scale";
import { GridColumns } from "@vx/grid";
import { Text } from "@vx/text";
import { max } from "d3-array";

const HorizontalStackedBar = ({
  width,
  height,
  handleMouseMove,
  handleMouseLeave,
  data,
  y,
  yFormat,
  yAxisLabel,
  keys,
  colors,
  margin,
  questionNumber
}) => {
  const totals = data.reduce((acc, cur) => {
    const t = keys.reduce((total, key) => {
      total += +cur[key];
      return total;
    }, 0);
    acc.push(t);
    return acc;
  }, []);

  const total_bar_offset = 8;
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const colorScale = scaleOrdinal({
    domain: keys,
    range: colors
  });
  const xScale = scaleLinear({
    rangeRound: [0, xMax],
    domain: [0, max(totals)],
    nice: true
  });
  const yScale = scaleBand({
    rangeRound: [yMax, 0],
    domain: data.map(y),
    padding: 0.2
  });

  return (
    <Group top={margin.top} left={margin.left}>
      <GridColumns
        scale={xScale}
        height={yMax + total_bar_offset}
        top={- total_bar_offset}
        tickValues={[25, 75]}
        stroke="#ABACAE"
        />
      <GridColumns
        scale={xScale}
        height={yMax + total_bar_offset}
        top={- total_bar_offset}
        tickValues={[50]}
        lineStyle={{strokeOpacity: "0.5"}}
        stroke="#333"
        strokeWidth="2px"
      />
      <Group className="bars">
        <BarStackHorizontal
          data={data}
          keys={keys}
          height={yMax}
          y={y}
          xScale={xScale}
          yScale={yScale}
          color={colorScale}
        >
          {barStacks => {
            return barStacks.map(barStack =>
              <Group className="bar-stack">
                {barStack.bars.map(bar => (
                  <Group 
                    className={`
                      bar
                      bar--demographic-${bar.bar.data.demographic_value.replace(/\s+/g, '-').toLowerCase()} 
                      bar--key-${bar.key.replace(/\s+/g, '-') .toLowerCase()}
                      bar--color-${bar.color.slice(1)}
                    `}
                    key={`barstack-horizontal-${barStack.index}-${bar.index}`}
                  >
                    <rect
                      className="bar__rectangle"
                      clip-path={`url(#clip-${questionNumber}-${barStack.index}-${bar.index})`}
                      x={bar.x}
                      y={bar.bar.data.demographic_value == "Total" ? bar.y - total_bar_offset : bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={bar.color}
                      stroke={bar.color}
                      strokeWidth="4"
                      onMouseLeave={handleMouseLeave ? handleMouseLeave : null}
                      onMouseMove={event =>
                        handleMouseMove
                          ? handleMouseMove({ event, data, datum: bar })
                          : null
                      }
                    />
                    <clipPath id={`clip-${questionNumber}-${barStack.index}-${bar.index}`}>
                      <rect
                        x={bar.x}
                        y={bar.bar.data.demographic_value == "Total" ? bar.y - total_bar_offset : bar.y}
                        width={bar.width}
                        height={bar.height}
                      />
                    </clipPath>
                    <Text
                      x={bar.x + 5}
                      y={bar.y + 0.5 * bar.height - (bar.bar.data.demographic_value == "Total" ? total_bar_offset : 0)}
                      className="bar__text bar__text--inside"
                      verticalAnchor="middle"
                    >
                      {bar.bar.data[bar.key] >= 6.5
                        && Math.round(bar.bar.data[bar.key])
                        + `%`
                      }
                    </Text>
                  </Group>
                ))}
              </Group>
            );
          }}
        </BarStackHorizontal>
      </Group>
      <AxisLeft
        scale={yScale}
        hideAxisLine={true}
        hideTicks={true}
        tickFormat={yFormat}
        label={yAxisLabel}
        tickLabelProps={(d) => ({
          width: margin.left,
          textAnchor: "end",
          verticalAnchor: "middle",
          fontSize: 14,
          fontWeight: (d == "2025" || d == "Total") && "bold", // TODO don't hard-code this text
          dy: d == "Total" && - total_bar_offset
        })}
      />
    </Group>
  );
};

HorizontalStackedBar.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  handleMouseMove: PropTypes.func,
  handleMouseLeave: PropTypes.func,
  data: PropTypes.array.isRequired,
  /**
   * Accessor function for y axis values
   */
  y: PropTypes.func.isRequired,
  /**
   * An array of strings with the column keys of each bar
   */
  keys: PropTypes.array.isRequired,
  colors: PropTypes.array.isRequired,
  xFormat: PropTypes.func,
  yFormat: PropTypes.func,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  numTicksX: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  margin: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
  })
};

HorizontalStackedBar.defaultProps = {
  margin: {
    top: 10,
    left: 60,
    right: 40,
    bottom: 40
  }
};

export default HorizontalStackedBar;
