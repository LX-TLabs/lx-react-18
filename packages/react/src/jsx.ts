import { ElementType, Ref, Key, Props,ReactElement } from "shared/ReactTypes";
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'

const createReactElement = (type: ElementType, key: Key, ref: Ref, props: Props ): ReactElement => {
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
  console.log('jsx', type, config, maybeChildren)
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
  return createReactElement(type, key, ref, props);
}

export const jsxDEV = (type: ElementType, config: any) => {
	// 单独处理 key ref
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = `${val}`;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	return createReactElement(type, key, ref, props);
};