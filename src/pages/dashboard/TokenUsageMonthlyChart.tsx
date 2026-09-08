import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import { useTheme } from "@mui/material/styles";
import type { MonthlyTokenUsagePoint } from "../../services/tokenUsageService";

type TokenUsageMonthlyChartProps = {
  points: MonthlyTokenUsagePoint[];
  colors: string[];
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const baseOptions: ApexOptions = {
  chart: {
    type: "bar",
    stacked: true,
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      columnWidth: "48%",
      borderRadius: 4,
    },
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (value: number) => numberFormatter.format(value),
    },
  },
  tooltip: {
    y: {
      formatter: (value: number) => `${numberFormatter.format(value)} tokens`,
    },
  },
  grid: {
    strokeDashArray: 4,
  },
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
    fontFamily: "'Public Sans', sans-serif",
    markers: {
      size: 12,
      shape: "square",
    },
    itemMargin: {
      horizontal: 12,
      vertical: 4,
    },
  },
};

const TokenUsageMonthlyChart = ({ points, colors }: TokenUsageMonthlyChartProps) => {
  const theme = useTheme();
  const line = theme.palette.divider;
  const secondary = theme.palette.text.secondary;
  const [options, setOptions] = useState<ApexOptions>(baseOptions);
  const models = Array.from(
    points.reduce((modelSet, point) => {
      Object.keys(point.modelTokens).forEach((model) => modelSet.add(model));
      return modelSet;
    }, new Set<string>())
  ).sort((modelA, modelB) => {
    const modelATokens = points.reduce((total, point) => total + (point.modelTokens[modelA] ?? 0), 0);
    const modelBTokens = points.reduce((total, point) => total + (point.modelTokens[modelB] ?? 0), 0);
    return modelBTokens - modelATokens;
  });

  useEffect(() => {
    setOptions({
      ...baseOptions,
      colors,
      xaxis: {
        ...baseOptions.xaxis,
        categories: points.map((point) => point.monthLabel),
        labels: {
          style: {
            colors: points.map(() => secondary),
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => numberFormatter.format(value),
          style: {
            colors: [secondary],
          },
        },
      },
      grid: {
        borderColor: line,
        strokeDashArray: 4,
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (value: number) => `${numberFormatter.format(value)} tokens`,
        },
      },
      legend: {
        ...baseOptions.legend,
        labels: {
          colors: secondary,
        },
      },
    });
  }, [colors, line, points, secondary]);

  const series = models.map((model) => ({
    name: model,
    data: points.map((point) => point.modelTokens[model] ?? 0),
  }));

  return <ReactApexChart options={options} series={series} type="bar" height={260} />;
};

export default TokenUsageMonthlyChart;
