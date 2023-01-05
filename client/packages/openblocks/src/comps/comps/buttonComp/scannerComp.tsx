import { Button, Dropdown, Menu, Skeleton } from "antd";
import { Button100, ButtonCompWrapper } from "comps/comps/buttonComp/buttonCompConstants";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { ScannerEventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { ButtonStyle } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { CustomModal, Section, sectionNames } from "openblocks-design";
import styled from "styled-components";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { hiddenPropertyView, disabledPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { arrayStringExposingStateControl } from "comps/controls/codeStateControl";
import { BoolControl } from "comps/controls/boolControl";
import { ItemType } from "antd/lib/menu/hooks/useItems";

const Error = styled.div`
  color: #f5222d;
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = styled.div`
  video {
    height: 250px;
    position: relative;
    object-fit: cover;
    background-color: #000;
  }
`;

const CustomModalStyled = styled(CustomModal)`
  .react-draggable {
    max-width: 100%;
  }
`

const BarcodeScannerComponent = React.lazy(() => import("react-qr-barcode-scanner"));

const ScannerTmpComp = (function () {
  const childrenMap = {
    data: arrayStringExposingStateControl("data"),
    text: withDefault(StringControl, trans("scanner.text")),
    continuous: BoolControl,
    uniqueData: withDefault(BoolControl, true),
    maskClosable: withDefault(BoolControl, true),
    onEvent: ScannerEventHandlerControl,
    disabled: BoolCodeControl,
    style: styleControl(ButtonStyle),
  };
  return new UICompBuilder(childrenMap, (props) => {
    const [showModal, setShowModal] = useState(false);
    const [errMessage, setErrMessage] = useState("");
    const [videoConstraints, setVideoConstraints] = useState<MediaTrackConstraints>({
      facingMode: "environment",
    });
    const [modeList, setModeList] = useState<ItemType[]>([]);
    const [dropdownShow, setDropdownShow] = useState(false);
    const [success, setSuccess] = useState(false)

    useEffect(() =>{
      if (!showModal && success) {
        props.onEvent("success");
      }
    }, [success, showModal])

    const continuousValue = useRef<string[]>([]);

    const handleUpdate = (err: any, result: any) => {
      if (!!result) {
        if (props.continuous) {
          continuousValue.current = [...continuousValue.current, result.text];
          const val = props.uniqueData ? [...new Set(continuousValue.current)] : continuousValue.current;
          props.data.onChange(val);
          props.onEvent("success");
        } else {
          props.data.onChange([result.text]);
          setShowModal(false);
          setSuccess(true);
        }
      } else {
        setSuccess(false);
      }
    };
    const handleErr = (err: any) => {
      if (typeof err === "string") {
        setErrMessage(err);
      } else {
        setErrMessage(err.message);
      }
      setSuccess(false);
    };

    const getModeList = () => {
      navigator.mediaDevices.enumerateDevices().then((data) => {
        const videoData = data.filter((item) => item.kind === "videoinput");
        const faceModeList = videoData.map((item, index) => ({
          label: item.label || trans("scanner.camera", { index: index + 1 }),
          key: item.deviceId,
        }));
        setModeList(faceModeList);
      });
    };

    return (
      <ButtonCompWrapper disabled={props.disabled}>
        <Button100
          $buttonStyle={props.style}
          disabled={props.disabled}
          onClick={() => {
            props.onEvent("click");
            setShowModal(true);
            continuousValue.current = [];
          }}
        >
          <span>{props.text}</span>
        </Button100>

        <CustomModalStyled
          showOkButton={false}
          showCancelButton={false}
          visible={showModal}
          destroyOnClose
          onCancel={() => {
            setShowModal(false);
            props.onEvent("close");
          }}
        >
          {!!errMessage ? (
            <Error>{errMessage}</Error>
          ) : (showModal && (
            <Wrapper>
              <Suspense fallback={<Skeleton />}>
                <BarcodeScannerComponent
                  key={JSON.stringify(videoConstraints)}
                  height={250}
                  delay={1000}
                  onUpdate={handleUpdate}
                  onError={handleErr}
                  videoConstraints={videoConstraints}
                />
              </Suspense>
              <div
                style={{ height: "42px" }}
                onClick={() => {
                  setDropdownShow(false);
                }}
              >
                <Dropdown
                  placement="bottomRight"
                  trigger={["click"]}
                  visible={dropdownShow}
                  onVisibleChange={(value) => setDropdownShow(value)}
                  overlay={
                    <Menu
                      items={modeList}
                      onClick={(value) =>
                        setVideoConstraints({ ...videoConstraints, deviceId: value.key })
                      }
                    />
                  }
                >
                  <Button
                    style={{ float: "right", marginTop: "10px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      getModeList();
                    }}
                  >
                    {trans("scanner.changeCamera")}
                  </Button>
                </Dropdown>
              </div>
            </Wrapper>
          ))}
        </CustomModalStyled>
      </ButtonCompWrapper>
    );
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.text.propertyView({ label: trans("text") })}
            {children.continuous.propertyView({ label: trans("scanner.continuous") })}
            {children.continuous.getView() &&
              children.uniqueData.propertyView({ label: trans("scanner.uniqueData") })}
            {children.maskClosable.propertyView({ label: trans("scanner.maskClosable") })}
          </Section>

          <Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
          </Section>

          <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>

          <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
        </>
      );
    })
    .build();
})();

export const ScannerComp = withExposingConfigs(ScannerTmpComp, [
  new NameConfig("data", trans("data")),
  new NameConfig("text", trans("button.textDesc")),
  ...CommonNameConfig,
]);
