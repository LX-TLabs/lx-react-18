import { FiberNode } from './fiber'
import { FunctionComponent, HostRoot, HostText, HostComponent } from './workTags'
import { mountChildFibers, reconcileChildFibers } from './childFiber';
import { ReactElement } from 'shared/ReactTypes'
import { UpdateQueue, processUpdateQueue } from './updateQueue'

/**
 * 生成子节点并进行挂载
 * @param workInProgress 
 * @param children 
 */
export const reconcileChildren = (workInProgress: FiberNode, children: any) => {
  // 判断时 mount 还是 update
  const current = workInProgress.alternate
  if (current) {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      children
    )
  } else {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      children
    )
  }
}

/**
 * 更新 HostRoot
 * @param workInProgress 
 * @returns 
 */
const updateHostRoot = (workInProgress: FiberNode) => {
  const baseState = workInProgress.memorizedState;
  const updateQueue = workInProgress.updateQueue as UpdateQueue<ReactElement>
  const pending = updateQueue.shared.pending
  // 执行前 清除工作
  updateQueue.shared.pending = null;
  const { memorizedState } = processUpdateQueue(baseState, pending)
  workInProgress.memorizedState = memorizedState

  const nextChildren = workInProgress.memorizedState
  reconcileChildren(workInProgress, nextChildren)
  return workInProgress.child
}

/**
 * 更新 HostComponent
 * @param workInProgress 
 */
const updateHostComponent = (workInProgress: FiberNode) => {
  // 根据element创建fiberNode
  const nextProps = workInProgress.pendingProps;
  const children = nextProps.children
  reconcileChildren(workInProgress, children)
  return workInProgress.child
}

// 生成子Fiber的方法
export const beginWork = (workInProgress: FiberNode) => {
  if (__DEV__) {
    console.log('beginWork流程', workInProgress.type);
  }

  switch (workInProgress.tag) {
    case FunctionComponent:
      return null
      // 根节点的情况
    case HostRoot:
      return updateHostRoot(workInProgress)
    case HostText:
      return null
    case HostComponent:
      return updateHostComponent(workInProgress)
    default:
      if (__DEV__) {
        console.log('未实现的tag类型', workInProgress.tag)
      }
      return null
  }
}

