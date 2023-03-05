import { Container } from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import { HostRoot } from './workTags'
import { createUpdateQueue, createUpdate, enqueueUpdate, UpdateQueue } from './updateQueue'
import { ReactElement } from 'shared/ReactTypes'
import { scheduleUpdateOnFiber } from './workLoop'
export const createContainer = (container: Container) => {
  // 创建HostRootFiber
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  // 创建 FiberRootNode
  const root = new FiberRootNode(container, hostRootFiber)
  // 创建更新链
  hostRootFiber.updateQueue = createUpdateQueue();
  return root
}

export const updateContainer = (
	element: ReactElement | null,
	root: FiberRootNode
) => {
  // 调度更新
  const hostRootFiber = root.current
  const update = createUpdate(element);
  enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElement | null>,
		update
	);
  scheduleUpdateOnFiber(hostRootFiber);
	return element;
}