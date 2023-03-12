import { FiberNode } from './fiber'
import { Dispatcher, Dispatch } from 'react/src/currentDispatcher'
import internals from 'shared/internals';
import { createUpdateQueue, UpdateQueue, createUpdate, enqueueUpdate } from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';



const { currentDispatcher } = internals;

// 当前render 的 fiber
let currentlyRenderingFiber: FiberNode | null = null;

let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

interface Hook {
  memoizedState: any;
  // 对于state，保存update相关数据
	updateQueue: unknown;
	// 指向下一个hook
	next: Hook | null;
}
export const renderWithHooks = (wip: FiberNode) => {
  currentlyRenderingFiber = wip
  const current = wip.alternate

  if (current !== null) {
    // update
    currentDispatcher.current = HookDispatcherOnUpdate;
  } else {
    // mount
    currentDispatcher.current = HookDispatcherOnMount;
  }

  // 赋值操作
	const Component = wip.type;
	const props = wip.memoizedProps;
	const children = Component(props);

  // 重置操作
  currentlyRenderingFiber = null
  currentHook = null
  workInProgressHook = null

  return children;
}


/**
 * mount 阶段 wip
 * 创建Hook 并通过Hook链接
 */
const mountWorkInProgressHook = () => {
  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null
  }
  if (workInProgressHook === null) {
    // mount时 第一个 hook
    if (currentlyRenderingFiber == null) {
      if (__DEV__) {
				console.error('mountWorkInprogressHook时currentlyRenderingFiber未定义');
			}
    } else {
      currentlyRenderingFiber.memorizedState = workInProgressHook = hook
    }
  } else {
    workInProgressHook = workInProgressHook.next = hook
  }
  return workInProgressHook as Hook;
}

/**
 * 触发更新
 * @param fiber 
 * @param updateQueue 
 * @param action 
 */
const dispatchSetState = <State>(
  fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) => {
  // 1. 把 action 挂载在updateQueue上
  const update = createUpdate(action);
  enqueueUpdate(updateQueue, update)
  // 2. 触发fiber 更新调度
  scheduleUpdateOnFiber(fiber)
}
/**
 * mount State
 * @param initialState 
 */
// hooks 更新相关
const mountState = <State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] => {
  // 找到当前 useState 对应的hook数据
  const hook = mountWorkInProgressHook();
  let memoizedState: State;
  // 根据 hooks 返回 计算后的state
  if (initialState instanceof Function) {
    memoizedState = initialState()
  } else {
    memoizedState = initialState
  }
  hook.memoizedState = memoizedState
  const queue = createUpdateQueue<State>()
  hook.updateQueue = queue;
  /**
   * 我们在使用 类似于 setState的 dispatch 的时候 只需要传 最后的action 就可以 就说明
   * dispatch 在定义的时候 就 基于 dispatchSetState 的情况上封装了一层
   */
  // @ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)
  return [memoizedState, dispatch]
}

const HookDispatcherOnMount: Dispatcher = {
	useState: mountState,
};

const HookDispatcherOnUpdate: Dispatcher = {
	useState: mountState,
};
