import { requestWidgetUpdate } from "react-native-android-widget";
import { getWidgetData } from "../services/routineData";
import { TodayWidget } from "./TodayWidget";

export const refreshWidget = () =>
  requestWidgetUpdate({
    widgetName: "TodayRoutine",
    renderWidget: async (widgetInfo) => {
      const { day, stats, items } = await getWidgetData();
      return (
        <TodayWidget
          day={day}
          stats={stats}
          items={items}
          width={widgetInfo.width}
        />
      );
    },
    widgetNotFound: () => {},
  });
