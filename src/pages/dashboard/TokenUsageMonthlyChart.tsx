import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";
import { useTheme } from "@mui/material/styles";
import type { MonthlyTokenUsagePoint } from "../../services/tokenUsageService";

type TokenUsageMonthlyChartProps = {
  points: MonthlyTokenUsagePoint[];
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const baseOptions: ApexOptions = {
  chart: {
    type: "bar",
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
    show: false,
  },
};

const TokenUsageMonthlyChart = ({ points }: TokenUsageMonthlyChartProps) => {
  const theme = useTheme();
  const line = theme.palette.divider;
  const secondary = theme.palette.text.secondary;
  const [options, setOptions] = useState<ApexOptions>(baseOptions);

  useEffect(() => {
    setOptions({
      ...baseOptions,
      colors: [theme.palette.primary.main],
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
    });
  }, [line, points, secondary, theme]);

  const series = [
    {
      name: "Tokens Used",
      data: points.map((point) => point.tokensUsed),
    },
  ];

  return <ReactApexChart options={options} series={series} type="bar" height={260} />;
};

export default TokenUsageMonthlyChart;
