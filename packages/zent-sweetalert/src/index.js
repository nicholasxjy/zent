import React, { Component, PropTypes } from 'react';
import Button from '@youzan/zent-button';
import { openDialog } from '@youzan/zent-dialog';
import Icon from '@youzan/zent-icon';
import cx from 'classnames';

const titleIconMap = {
  info: 'info-circle-o',
  success: 'check-circle-o',
  error: 'close-circle-o',
  warning: 'error-circle-o'
};

const commonProps = {
  closeBtn: false,
  maskClosable: false
};

function isPromise(a) {
  return a && typeof a.then === 'function';
}

class ActionButton extends Component {
  static propTypes = {
    getClose: PropTypes.func.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    children: PropTypes.node
  }

  state = {
    loading: false
  }

  onClick = () => {
    const { onClick: callback, getClose } = this.props;
    const close = getClose();

    // callback没传，直接关闭
    if (!callback) {
      return close();
    }

    const callbackHasArgs = callback.length > 0;
    const value = callbackHasArgs ? callback(close) : callback();

    // 返回值是个Promise，resolve后自动关闭
    if (isPromise(value)) {
      this.setState({
        loading: true
      });
      value.then(() => {
        // 马上就关闭了，没必要setState({loading: true})
        close();
      });
      return;
    }

    // callback无参数并且返回值不是false的时候自动关闭
    if (!callbackHasArgs && value !== false) {
      close();
    }
  }

  render() {
    const { className, type, children } = this.props;
    const { loading } = this.state;

    return <Button type={type} className={className} loading={loading} onClick={this.onClick}>{children}</Button>;
  }
}

function getTitle(title, type, prefix) {
  if (!type) {
    return title;
  }

  const icon = titleIconMap[type];
  return <div className={`${prefix}-sweetalert-icon-title`}><Icon className={`${prefix}-sweetalert-type-icon`} type={icon} />{title}</div>;
}

export function alert(config = {}) {
  let { className, prefix, title, type, content, confirmText, onConfirm } = config;
  prefix = prefix || 'zent';
  title = getTitle(title, type, prefix) || '提示';
  className = className || '';
  confirmText = confirmText || '我知道了';

  const close = openDialog({
    ...commonProps,
    className: cx(`${prefix}-sweetalert-alert`, {
      [className]: !!className
    }),
    title,
    children: content,
    footer: (
      <ActionButton type="primary" className={`${prefix}-sweetalert-alert-btn-confirm`} getClose={() => close} onClick={onConfirm}>
        {confirmText}
      </ActionButton>
    )
  });

  return close;
}
export const info = alert;

export function confirm(config = {}) {
  let { className, prefix, title, type, content, confirmText, onConfirm, cancelText, onCancel } = config;
  className = className || '';
  prefix = prefix || 'zent';
  title = getTitle(title, type, prefix) || '确认';
  confirmText = confirmText || '确定';
  cancelText = cancelText || '取消';

  const close = openDialog({
    ...commonProps,
    className: cx(`${prefix}-sweetalert-confirm`, {
      [className]: !!className
    }),
    title,
    children: content,
    footer: [
      <ActionButton key="ok" type="primary" className={`${prefix}-sweetalert-confirm-btn-confirm`} getClose={() => close} onClick={onConfirm}>{confirmText}</ActionButton>,
      <ActionButton key="cancel" type="default" className={`${prefix}-sweetalert-confirm-btn-cancel`} getClose={() => close} onClick={onCancel}>{cancelText}</ActionButton>
    ]
  });

  return close;
}

export default {
  alert,
  info,
  confirm
};
