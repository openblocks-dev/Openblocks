import { ColumnComp, newPrimaryColumn } from "comps/comps/tableComp/column/tableColumnComp";
import { list } from "comps/generators/list";
import { getReduceContext } from "comps/utils/reduceContext";
import _ from "lodash";
import { CompAction, customAction, isMyCustomAction } from "openblocks-core";
import { JSONObject, JSONValue } from "util/jsonTypes";
import { getObjectId } from "util/objectUtils";

/**
 * column list
 */
const ColumnListTmpComp = list(ColumnComp);

/**
 * rowExample is used for code prompts
 */
type RowExampleType = JSONObject | undefined;
type ActionDataType = {
  type: "dataChanged";
  rowExample: RowExampleType;
  doGeneColumn: boolean;
  dynamicColumn: boolean;
  data: Array<JSONObject>;
};

export function tableDataRowExample(data: Array<JSONObject>) {
  if (data.length <= 0) {
    return undefined;
  }
  if (typeof data[0] === "string") {
    // do not parse arrays in string format
    return undefined;
  }
  const rowExample: Record<string, JSONValue | undefined> = {};
  // merge head 50 data keys
  data.slice(0, 50).forEach((d) => {
    Object.keys(d).forEach((key) => {
      if (!rowExample.hasOwnProperty(key)) {
        rowExample[key] = d[key];
      }
    });
  });
  return rowExample;
}

export class ColumnListComp extends ColumnListTmpComp {
  override reduce(action: CompAction): this {
    if (isMyCustomAction<ActionDataType>(action, "dataChanged")) {
      const rowExample = action.value.rowExample;
      const { readOnly } = getReduceContext();
      let comp = this;
      if (action.value.doGeneColumn && (action.value.dynamicColumn || !readOnly)) {
        const actions = this.geneColumnsAction(rowExample);
        comp = this.reduce(this.multiAction(actions));
      }
      return comp.updateRenderData(action.value.data);
    }
    return super.reduce(action);
  }

  getChangeSet() {
    const changeSet: Record<string, Record<string, JSONValue>> = {};
    const columns = this.getView();
    columns.forEach((column) => {
      const columnChangeSet = column.getChangeSet();
      Object.keys(columnChangeSet).forEach((dataIndex) => {
        Object.keys(columnChangeSet[dataIndex]).forEach((key) => {
          if (!_.isNil(columnChangeSet[dataIndex][key])) {
            if (!changeSet[key]) changeSet[key] = {};
            changeSet[key][dataIndex] = columnChangeSet[dataIndex][key];
          }
        });
      });
    });
    return changeSet;
  }

  clearChangeSet() {
    const columns = this.getView();
    columns.forEach((column) => column.clearChangeSet());
  }

  updateRenderData(data: Array<JSONObject>) {
    const columns = this.getView();
    const actions = columns.map((col) => {
      const dataIndex = col.children.dataIndex.getView();
      const paramValueMap = _.chain(data)
        .toPairs()
        .fromPairs()
        .mapValues((row, index) => ({
          currentCell: row[dataIndex],
          currentRow: row,
          currentIndex: index,
          currentOriginalIndex: index,
        }))
        .value();
      const render = col.children.render.clear().batchSet(paramValueMap);
      const newCol = col.setChild("render", render);
      return this.pushCompAction(newCol);
    });
    return this.reduce(this.multiAction([this.clearAction(), ...actions]));
  }

  /**
   * If the table data changes, call this method to trigger the action
   */
  dispatchDataChanged(param: {
    rowExample: JSONObject;
    doGeneColumn: boolean;
    dynamicColumn: boolean;
    data: Array<JSONObject>;
  }): void {
    this.dispatch(
      customAction<ActionDataType>({
        type: "dataChanged",
        ...param,
      })
    );
  }

  /**
   * According to the data, adjust the column
   */
  private geneColumnsAction(rowExample: RowExampleType) {
    // If no data, return directly
    if (rowExample === undefined || rowExample === null) {
      return [];
    }
    const dataKeys = Object.keys(rowExample);
    if (dataKeys.length === 0) {
      return [];
    }
    const columnsView = this.getView();
    const actions: Array<any> = [];
    let deleteCnt = 0;
    columnsView.forEach((column, index) => {
      if (column.getView().isCustom) {
        return;
      }
      const dataIndex = column.getView().dataIndex;
      if (!dataKeys.find((key) => dataIndex === key)) {
        // to Delete
        actions.push(this.deleteAction(index - deleteCnt));
        deleteCnt += 1;
      }
    });
    // The order should be the same as the data
    dataKeys.forEach((key) => {
      if (!columnsView.find((column) => column.getView().dataIndex === key)) {
        // to Add
        actions.push(this.pushAction(newPrimaryColumn(key)));
      }
    });
    if (actions.length === 0) {
      return [];
    }
    return actions;
  }

  // node() {
  //   const rNode = super.node();
  //   console.info("ColumnListComp node id: ", getObjectId(rNode!), "\nnode: ", rNode);
  //   return rNode;
  // }
}
