import React, { PureComponent, Component } from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import find from 'lodash/find';
import defaultTo from 'lodash/defaultTo';
import isFunction from 'lodash/isFunction';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import DesignPreviewItem from './DesignPreviewItem';
import DesignPreviewController from './DesignPreviewController';
import DesignEditorItem from '../editor/DesignEditorItem';
import DesignEditorAddComponent from '../editor/DesignEditorAddComponent';
import { isExpectedDesginType } from '../utils/design-type';
import { isGrouped } from '../utils/component-group';
import { DND_PREVIEW_CONTROLLER } from './constants';
import { ADD_COMPONENT_OVERLAY_POSITION } from '../constants';

/**
 * DesignPreview 和 config 组件是相互关联的
 *
 * 这个组件里的一些 props 是需要 config 组件提供的
 */
class DesignPreview extends (PureComponent || Component) {
  // All props in this component are injected by Design
  static propTypes = {
    className: PropTypes.string,

    prefix: PropTypes.string,

    design: PropTypes.object.isRequired,

    components: PropTypes.array.isRequired,

    value: PropTypes.array.isRequired,

    appendableComponents: PropTypes.array,

    showAddComponentOverlay: PropTypes.bool.isRequired,

    addComponentOverlayPosition: PropTypes.number.isRequired,

    selectedUUID: PropTypes.string,

    getUUIDFromValue: PropTypes.func.isRequired,

    onSelect: PropTypes.func.isRequired,

    // 处理添加按钮的回调函数
    onAdd: PropTypes.func.isRequired,

    // 添加新组件
    onAddComponent: PropTypes.func.isRequired,

    onDelete: PropTypes.func.isRequired,

    onEdit: PropTypes.func.isRequired,

    onMove: PropTypes.func.isRequired,

    disabled: PropTypes.bool,

    // 每个组件的实例数量
    componentInstanceCount: PropTypes.object,

    // 以下 props 由 config 组件提供
    background: PropTypes.string
  };

  static defaultProps = {
    background: '#f9f9f9',
    disabled: false,
    appendableComponents: [],
    prefix: 'zent'
  };

  previewItems = {};
  editorItems = {};

  render() {
    const {
      components,
      value,
      validations,
      showError,
      onComponentValueChange,
      componentInstanceCount,
      design,
      appendableComponents,
      showAddComponentOverlay,
      addComponentOverlayPosition,
      selectedUUID,
      getUUIDFromValue,
      onAddComponent,
      onSelect,
      onDelete,
      onEdit,
      onAdd,
      onMove,
      className,
      prefix,
      globalConfig,
      disabled,
      background
    } = this.props;
    const isComponentsGrouped = isGrouped(appendableComponents);
    const cls = cx(`${prefix}-design-preview`, className);
    const hasAppendableComponent = appendableComponents.length > 0;

    return (
      <DragDropContext onDragEnd={this.onPreviewDragEnd}>
        <div className={cls} style={{ background }}>
          {disabled && <div className={`${prefix}-design__disabled-mask`} />}

          <Droppable
            droppableId={`${prefix}-design-preview-list`}
            type={DND_PREVIEW_CONTROLLER}
            direction="vertical"
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className={cx(`${prefix}-design__item-list`, {
                  [`${prefix}-design__item-list--full-height`]: !hasAppendableComponent
                })}
              >
                {value.map(v => {
                  const valueType = v.type;
                  const comp = find(components, c =>
                    isExpectedDesginType(c, valueType)
                  );
                  const PreviewItem = comp.previewItem || DesignPreviewItem;
                  const EditorItem = comp.editorItem || DesignEditorItem;
                  const id = getUUIDFromValue(v);
                  const selected = id === selectedUUID;
                  const PreviewController =
                    comp.previewController || DesignPreviewController;

                  return (
                    <PreviewItem
                      prefix={prefix}
                      key={id}
                      id={id}
                      ref={this.savePreviewItem(id)}
                    >
                      <PreviewController
                        prefix={prefix}
                        value={v}
                        globalConfig={globalConfig}
                        design={design}
                        id={id}
                        allowHoverEffects={!snapshot.isDraggingOver}
                        dragable={defaultTo(comp.dragable, true)}
                        editable={defaultTo(comp.editable, true)}
                        configurable={defaultTo(comp.configurable, true)}
                        canDelete={defaultTo(comp.canDelete, true)}
                        canInsert={defaultTo(comp.canInsert, true)}
                        highlightWhenSelect={defaultTo(
                          comp.highlightWhenSelect,
                          true
                        )}
                        isSelected={selected}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onAdd={onAdd}
                        onMove={onMove}
                        component={comp.preview}
                        previewProps={getAdditionalProps(comp.previewProps, v)}
                      />

                      {selected &&
                        !showAddComponentOverlay && (
                          <EditorItem
                            prefix={prefix}
                            disabled={disabled}
                            ref={this.saveEditorItem(id)}
                          >
                            <comp.editor
                              {...getAdditionalProps(comp.editorProps, v)}
                              value={v}
                              onChange={onComponentValueChange(v)}
                              globalConfig={globalConfig}
                              design={design}
                              validation={validations[id] || {}}
                              showError={showError}
                              prefix={prefix}
                            />
                          </EditorItem>
                        )}

                      {selected &&
                        showAddComponentOverlay && (
                          <DesignEditorItem
                            ref={this.saveEditorItem(id)}
                            prefix={prefix}
                            className={cx(
                              `${prefix}-design-add-component-overlay`,
                              {
                                [`${prefix}-design-add-component-overlay--top`]:
                                  addComponentOverlayPosition ===
                                  ADD_COMPONENT_OVERLAY_POSITION.TOP,
                                [`${prefix}-design-add-component-overlay--bottom`]:
                                  addComponentOverlayPosition ===
                                  ADD_COMPONENT_OVERLAY_POSITION.BOTTOM,
                                [`${prefix}-design-add-component-overlay--grouped`]: isComponentsGrouped,
                                [`${prefix}-design-add-component-overlay--mixed`]: !isComponentsGrouped
                              }
                            )}
                          >
                            <DesignEditorAddComponent
                              prefix={prefix}
                              fromSelected
                              componentInstanceCount={componentInstanceCount}
                              components={appendableComponents}
                              onAddComponent={onAddComponent}
                            />
                          </DesignEditorItem>
                        )}
                    </PreviewItem>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {hasAppendableComponent && (
            <div
              className={cx(`${prefix}-design__add`, {
                [`${prefix}-design__add--grouped`]: isComponentsGrouped,
                [`${prefix}-design__add--mixed`]: !isComponentsGrouped
              })}
            >
              <DesignEditorAddComponent
                prefix={prefix}
                componentInstanceCount={componentInstanceCount}
                components={appendableComponents}
                onAddComponent={onAddComponent}
              />
            </div>
          )}
        </div>
      </DragDropContext>
    );
  }

  onPreviewDragEnd = result => {
    const { source, destination } = result;

    // dropped outside
    if (!destination) {
      return;
    }

    const { onMove } = this.props;
    onMove(source.index, destination.index);
  };

  savePreviewItem = id => instance => {
    this.previewItems[id] = instance;
  };

  saveEditorItem = id => instance => {
    this.editorItems[id] = instance;
  };

  scrollToItem = (id, offsets) => {
    const item = this.previewItems[id];

    if (!item) {
      return;
    }

    item.scrollTop(offsets);
  };

  getEditorBoundingBox(id) {
    const item = this.editorItems[id];

    if (!item) {
      return;
    }

    return item.getBoundingBox();
  }
}

function getAdditionalProps(propsOrFn, value) {
  const props = isFunction(propsOrFn) ? propsOrFn(value) : propsOrFn;

  return props || {};
}

export default DesignPreview;
