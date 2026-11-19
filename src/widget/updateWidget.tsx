import { requestWidgetUpdate } from "react-native-android-widget";
import { getWidgetData } from "../services/routineData";
import { TodayWidget } from "./TodayWidget";

export const refreshWidget = () =>
  requestWidgetUpdate({
    widgetName: "TodayRoutine",
    renderWidget: async () => {
      const { day, stats, items } = await getWidgetData();
      return <TodayWidget day={day} stats={stats} items={items} />;
    },
    widgetNotFound: () => {},
  });
