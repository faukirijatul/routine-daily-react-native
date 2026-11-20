import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import {
  getWidgetData,
  toggleRoutineStatus,
} from "../services/routineData";
import { TodayWidget } from "./TodayWidget";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const data = await getWidgetData();
      props.renderWidget(
        <TodayWidget
          day={data.day}
          stats={data.stats}
          items={data.items}
          width={props.widgetInfo.width}
        />,
      );
      break;
    }

    default:
      break;
  }
}
