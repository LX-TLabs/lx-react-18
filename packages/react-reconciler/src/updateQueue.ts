import { Action } from 'shared/ReactTypes'
export interface Update<State> {
  action: Action<State>;
  next: Update<any> | null
}

export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null
  }
}

// 创建一个update
export const createUpdate = <State>(action: Action<State>): Update<State> => {
  if (__DEV__) {
		console.log('创建update：', action);
	}
  return {
    action: action,
    next: null
  }
}

// 往 UpdateQueue 塞入一个 Update
export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>
) => {
  const pending = updateQueue.shared.pending;
  // updateQueue shared pending 是一个环状链表
  if (pending === null) {
    // 如果为空 
    update.next = update
  } else {
    // pending = a -> a
		// pending = b -> a -> b
		// pending = c -> a -> b -> c
    update.next = pending.next;
    pending.next = update
  }
  updateQueue.shared.pending = update
}

// 初始化
export const createUpdateQueue = <Action>() => {
	const updateQueue: UpdateQueue<Action> = {
		shared: {
			pending: null
		},
	};
	return updateQueue;
};

// 消费一个Update
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null,
): {
	memorizedState: State;
} => {
  const result:ReturnType<typeof processUpdateQueue<State>> = {
    memorizedState: baseState
  }

  // 更新后的baseState（有跳过情况下与memoizedState不同）
  let newBaseState = baseState;

  if (pendingUpdate !== null) {
    // 第一个update
		const first = pendingUpdate.next;
		let pending = pendingUpdate.next;
    do {
      const action = pending?.action
      if (action instanceof Function) {
        newBaseState = action(newBaseState)
      } else {
        baseState = action;
      }
      pending = pending?.next as Update<State>;
    } while (pending === first) // 环链判断
  }

  result.memorizedState = newBaseState;

  return result
}