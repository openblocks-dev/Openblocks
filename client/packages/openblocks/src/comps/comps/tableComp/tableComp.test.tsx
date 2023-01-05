import { ColumnComp } from "comps/comps/tableComp/column/tableColumnComp";
import { getTableTransData } from "comps/comps/tableComp/tableUtils";
import { evalAndReduce } from "comps/utils";
import _ from "lodash";
import { changeChildAction, fromValue } from "openblocks-core";
import { MemoryRouter } from "react-router-dom";
import { MockTableComp } from "./mockTableComp";
import { TableComp } from "./tableComp";

test("test column", () => {
  const columnData = {
    title: "name",
    // editable: true, // TODO: change to boolean
  };
  let comp = new ColumnComp({ value: columnData });
  comp = evalAndReduce(comp);
  const columnOutput = comp.getView();
  expect(columnOutput.title).toEqual(columnData.title);
  // expect(columnOutput.editable).toEqual(columnData.editable);
});

test("test column render", () => {
  const columnData = {
    render: {
      compType: "text" as const,
      comp: {
        text: "{{currentRow.id}}",
      },
    },
    // editable: true, // TODO: change to boolean
  };
  const paramValueMap = {
    0: {
      currentCell: null,
      currentIndex: null,
      currentRow: { id: "hello" },
      currentOriginalIndex: null,
    },
  };
  let comp = new ColumnComp({ value: columnData });
  const render = comp.children.render.clear().batchSet(paramValueMap);
  comp = comp.setChild("render", render);
  comp = evalAndReduce(comp);
  const columnOutput = comp.getView();
  expect(columnOutput.render[0].getView().view({}).props.children.props.normalView).toEqual(
    "hello"
  );
  // FIXME: see what should be output if the input is wrong
  // expect(columnOutput.render()).toEqual("");
  // expect(columnOutput.render(null, "def")).toEqual("");
});

test("test table", async () => {
  // jest.setTimeout(1000);
  const tableData = {
    data: JSON.stringify([{ a: 1 }]),
    columns: [
      {
        dataIndex: "a",
        hide: true,
      },
      {
        title: "custom",
        dataIndex: "",
        isCustom: true,
      },
    ],
  };
  const exposingInfo: any = {
    query1: fromValue({ data: [{ q: 1 }] }),
    query2: fromValue({ data: [{ q2: 2 }] }),
  };
  let comp = new TableComp({
    dispatch: (action) => {
      comp = evalAndReduce(comp.reduce(action), exposingInfo);
    },
    value: tableData,
  });
  comp = evalAndReduce(comp);
  let columns = comp.children.columns.getView();
  expect(columns.length).toEqual(2);
  comp = evalAndReduce(comp.reduce(changeChildAction("data", '[{"a":1, "c":2, "d":3}]')));
  await new Promise((r) => setTimeout(r, 20));
  columns = comp.children.columns.getView();
  expect(columns.length).toEqual(4);
  expect(columns[0].getView().dataIndex).toEqual("a");
  expect(columns[0].getView().hide).toBe(true);
  expect(columns[1].getView().title).toEqual("custom");
  expect(columns[2].getView().title).toEqual("c");
  expect(columns[3].getView().title).toEqual("d");
}, 1000);

// FIXME: add a single test for the click action of the table

function DebugContainer(props: any) {
  return (
    <MemoryRouter initialEntries={[{ pathname: "/", search: "?value=teresa_teng" }]}>
      {props.comp.getView()}
    </MemoryRouter>
  );
}

test("test mock table render", () => {
  let comp = new MockTableComp({});
  comp = evalAndReduce(comp);
  // render(<DebugContainer comp={comp}/>);
  // screen.getByText(/Date/i);
});

test("test table data transform", () => {
  function getAndExpectTableData(expectDisplayDataLen: number, comp: any) {
    const exposingValues = comp.exposingValues;
    const displayData = exposingValues["displayData"];
    const { columns, pagination, data, sort, toolbar } = comp.getProps();
    const columnViews = columns.map((c: any) => c.getView());
    // Transform, sort, filter the raw data.
    const transformedData = getTableTransData(
      data,
      columnViews,
      pagination.pageSize,
      toolbar.filter,
      sort,
      toolbar.searchText,
      toolbar.showFilter,
      toolbar.columnSetting
    ).map((d) => d.originData);
    expect(data.length).toEqual(3);
    expect(displayData.length).toEqual(expectDisplayDataLen);
    // Remove the custom column, displayData is the same as tranFormData, if title is not defined
    expect(displayData.map((d: any) => _.omit(d, "custom"))).toEqual(transformedData);
    return { transformedData, data, displayData };
  }

  const tableData = {
    data: JSON.stringify([
      { id: 1, name: "gg" },
      { id: 5, name: "gg2" },
      { id: 3, name: "jjj" },
    ]),
    columns: [
      {
        dataIndex: "id",
        isCustom: false,
        sortable: true,
        render: { compType: "text" as const, comp: { text: "{{currentCell}}" } },
      },
      {
        dataIndex: "name",
        isCustom: false,
        render: { compType: "text" as const, comp: { text: "{{currentCell}}" } },
      },
      {
        title: "custom",
        dataIndex: "ealekfg",
        isCustom: true,
        render: {
          compType: "image" as const,
          comp: {
            src: "{{currentRow.id}}",
          },
        },
      },
    ],
  };
  let comp = new TableComp({
    dispatch: (action) => {
      comp = evalAndReduce(comp.reduce(action));
    },
    value: tableData,
  });
  comp = evalAndReduce(comp);
  comp = comp.updateContext();
  // id sort
  comp = evalAndReduce(
    comp.reduce(
      changeChildAction("sort", [
        {
          column: "id",
          desc: true,
        },
      ])
    )
  );
  let { transformedData, data, displayData } = getAndExpectTableData(3, comp);
  expect(transformedData.map((d: any) => d["id"])).toEqual([5, 3, 1]);
  // search
  comp = evalAndReduce(
    comp.reduce(
      changeChildAction("toolbar", {
        searchText: "gg",
      })
    )
  );
  getAndExpectTableData(2, comp);
  // filter
  comp = evalAndReduce(
    comp.reduce(
      changeChildAction("toolbar", {
        showFilter: true,
        filter: {
          stackType: "and",
          filters: [
            {
              columnKey: "id",
              filterValue: "4",
              operator: "gt",
            },
            {
              columnKey: "id",
              filterValue: "5",
              operator: "lte",
            },
          ],
        },
      })
    )
  );
  getAndExpectTableData(1, comp);
});
