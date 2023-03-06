import { BoolControl } from "comps/controls/boolControl";
import {
  BoolCodeControl,
  JSONObjectArrayControl,
  StringControl,
} from "comps/controls/codeControl";
import { arrayStringExposingStateControl } from "comps/controls/codeStateControl";
import { LabelControl } from "comps/controls/labelControl";
import { styleControl } from "comps/controls/styleControl";
import { CascaderStyle } from "comps/controls/styleControlConstants";
import {
  allowClearPropertyView,
  disabledPropertyView,
  hiddenPropertyView,
  placeholderPropertyView,
  showSearchPropertyView,
} from "comps/utils/propertyUtils";
import { i18nObjs, trans } from "i18n";
import { RecordConstructorToComp } from "openblocks-core";
import { Section, sectionNames } from "openblocks-design";
import { SelectEventHandlerControl } from "../../controls/eventHandlerControl";
import { MarginControl } from "../../controls/marginControl";
import { PaddingControl } from "../../controls/paddingControl";

export const defaultDataSource = JSON.stringify(i18nObjs.cascader, null, " ");

export const CascaderChildren = {
  value: arrayStringExposingStateControl("value", i18nObjs.cascaderDefult),
  label: LabelControl,
  placeholder: StringControl,
  disabled: BoolCodeControl,
  onEvent: SelectEventHandlerControl,
  allowClear: BoolControl,
  options: JSONObjectArrayControl,
  style: styleControl(CascaderStyle),
  showSearch: BoolControl.DEFAULT_TRUE,
  margin: MarginControl,
  padding: PaddingControl,
};

export const CascaderPropertyView = (
  children: RecordConstructorToComp<
    typeof CascaderChildren & { hidden: typeof BoolCodeControl }
  >
) => (
  <>
    <Section name={sectionNames.basic}>
      {children.options.propertyView({ label: trans("cascader.options") })}
      {children.value.propertyView({ label: trans("prop.defaultValue") })}
      {placeholderPropertyView(children)}
    </Section>

    {children.label.getPropertyView()}

    <Section name={sectionNames.interaction}>
      {children.onEvent.getPropertyView()}
      {disabledPropertyView(children)}
    </Section>

    <Section name={sectionNames.advanced}>
      {allowClearPropertyView(children)}
      {showSearchPropertyView(children)}
    </Section>

    <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>

    <Section name={sectionNames.style}>
      {children.style.getPropertyView()}
    </Section>
    <Section name={trans("style.margin")}>
      {children.margin.getPropertyView()}
    </Section>
    <Section name={trans("style.padding")}>
      {children.padding.getPropertyView()}
    </Section>
  </>
);
