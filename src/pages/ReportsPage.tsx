import { useState, useEffect } from "react";
import {  apiCall } from "@/utils/formatters"; // Add this import

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const ReportsPage = ({ authToken }) => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [period, setPeriod] = useState("month");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchReport();
    }, [authToken, period, startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ period });
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const data = await apiCall(
                `/reports/sales-profit?${params.toString()}`,
                "GET",
                null,
                authToken,
            );
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <div className="text-center p-4 text-gray-700 dark:text-gray-300">
                Loading reports...
            </div>
        );
    if (error)
        return (
            <div className="text-center p-4 text-red-500">Error: {error}</div>
        );

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">
                Sales & Profit Report
            </h2>

            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="flex-1 min-w-[180px]">
                    <Label
                        htmlFor="period"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        Period:
                    </Label>
                    <Select onValueChange={setPeriod} value={period}>
                        <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-50">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                            <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <Label
                        htmlFor="startDate"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        Start Date:
                    </Label>
                    <Input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <Label
                        htmlFor="endDate"
                        className="text-gray-700 dark:text-gray-300"
                    >
                        End Date:
                    </Label>
                    <Input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full dark:bg-gray-700 dark:text-gray-50"
                    />
                </div>
                <Button
                    onClick={fetchReport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md mt-auto"
                >
                    Apply Filters
                </Button>
            </div>

            {reportData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart
                        data={reportData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-300 dark:stroke-gray-600"
                        />
                        <XAxis
                            dataKey="report_period"
                            className="text-gray-700 dark:text-gray-300"
                        />
                        <YAxis className="text-gray-700 dark:text-gray-300" />
                        <Tooltip
                            formatter={(value) =>
                                `$${parseFloat(value).toFixed(2)}`
                            }
                            labelFormatter={(label) => `Period: ${label}`}
                            contentStyle={{
                                backgroundColor: "rgb(31 41 55)",
                                borderColor: "rgb(75 85 99)",
                                color: "rgb(229 231 235)",
                            }}
                            itemStyle={{ color: "rgb(229 231 235)" }}
                        />
                        <Legend wrapperStyle={{ color: "rgb(229 231 235)" }} />
                        <Bar
                            dataKey="total_revenue"
                            fill="#8884d8"
                            name="Total Revenue"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="total_cogs"
                            fill="#82ca9d"
                            name="Total COGS"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="gross_profit"
                            fill="#ffc658"
                            name="Gross Profit"
                            radius={[4, 4, 0, 0]}
                        />
                    </RechartsBarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center p-4 text-gray-700 dark:text-gray-300">
                    No report data available for the selected period.
                </p>
            )}
        </div>
    );
};

export default ReportsPage;