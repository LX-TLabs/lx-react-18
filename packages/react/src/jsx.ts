import { ElementType, Ref, Key, Props,ReactElement } from "shared/ReactTypes";
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'

const createReactElememt = (type: ElementType, key: Key, ref: Ref, props: Props ): ReactElement => {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    props,
    ref,
    __mark: 'LX_TLabs'
  }
}

function hasValidKey(config: any) {
	return config.key !== undefined;
}

function hasValidRef(config: any) {
	return config.ref !== undefined;
}


export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
  let key: Key = null;
  let ref: Ref = null;
  const props: any = {};

  // 遍历 config 取出 key 和 ref 其他的塞入到 props中
  for (let prop in config) {
    const val = config[prop]
    if (hasValidKey(config)) {
      key = '' + val;
      continue;
    }

    if (prop === 'ref' && val !== undefined) {
			if (hasValidRef(config)) {
				ref = val;
			}
			continue;
		}

    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val
    }

  }

  // 处理 maybeChildren 情况
  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0];
    } else {
      props.children = maybeChildren;
    }
  }
  return createReactElememt(type, key, ref, props);
}