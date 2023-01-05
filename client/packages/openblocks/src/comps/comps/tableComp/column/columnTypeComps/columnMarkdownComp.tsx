import { TextArea } from "components/TextArea";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ColumnValueTooltip } from "comps/comps/tableComp/column/simpleColumnTypeComps";
import { StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { markdownCompCss, TacoMarkDown } from "openblocks-design";
import styled from "styled-components";

const Wrapper = styled.div`
  ${markdownCompCss};
  max-height: 32px;

  > .markdown-body {
    margin: 0;
  }
`;

const childrenMap = {
  text: StringControl,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

export const ColumnMarkdownComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return (
        <Wrapper>
          <TacoMarkDown>{value}</TacoMarkDown>
        </Wrapper>
      );
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => (
      <TextArea
        defaultValue={props.value}
        autoFocus
        bordered={false}
        onChange={(e) => {
          const value = e.target.value;
          props.onChange(value);
        }}
        onBlur={props.onChangeEnd}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
      </>
    ))
    .build();
})();
