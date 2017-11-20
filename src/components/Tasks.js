import React, { Component } from 'react';

import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { GC_USER_ID } from '../constants';
import { TasksList } from './TasksList';

class Tasks extends Component {

  state = {
    description: '',
  }

  componentDidMount() {
    this._subscribeToNewTasks()
    this._subscribeToNewCompletes()
  }

  _subscribeToNewTasks = () => {
    this.props.AllTasksQuery.subscribeToMore({
      document: gql`
        subscription {
          Task(filter: {
            mutation_in: [CREATED]
          }){
            node {
              id
              description
              createdAt
              postedBy {
                id
                name
              }
              completed {
                id
              }
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const newAllTasks = [
          ...previous.allTasks,
          subscriptionData.Task.node
        ]

        for( var i=0; i<newAllTasks.length-1; i++ ) {
          if ( newAllTasks[i].id === newAllTasks[i+1].id ) {
            newAllTasks.splice(i, 1);
          }
        }

        const result = {
          ...previous,
          allTasks: newAllTasks
        }
        return result
      }
    })
  }

  _updateCacheAfterComplete = (store, createComplete, taskId) => {
    const data = store.readQuery({ query: ALL_TASKS_QUERY })
    const completedTasks = data.allTasks.find(task => task.id === taskId)
    completedTasks.completed = createComplete.task.completed
    store.writeQuery({ query: ALL_TASKS_QUERY, data })
  }

  _subscribeToNewCompletes = () => {
    this.props.AllTasksQuery.subscribeToMore({
      document: gql`
        subscription {
          Complete(filter: {
            mutation_in: [CREATED]
          }) {
            node {
              id
              task {
                id
                description
                createdAt
                postedBy {
                  id
                  name
                }
                completed {
                  id
                  user
                }
              }
              user
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const completedTaskIndex = previous.allTasks.findIndex(task => task.id === subscriptionData.Complete.node.task.id)
        const task = subscriptionData.Complete.node.task
        const newAllTasks = previous.allTasks.slice()
        newAllTasks[completedTaskIndex] = task
        const result = {
          ...previous,
          allTasks: newAllTasks
        }
        return result
      }
    })
  }

  _createTask = async () => {
    const postedById = localStorage.getItem(GC_USER_ID)
    if (!postedById) {
      console.error('No user logged in')
      return
    }
    const { description } = this.state
    const tmpTaskID = Math.round(Math.random() * -1000000);
    await this.props.CreateTaskMutation({
      variables: {
        description,
        postedById,
      },
      optimisticResponse: {
        __typename: 'CreateTaskMutation',
       createTask: {
         id: tmpTaskID,
         description: description,
         completed:null,
         createdAt: Date,
         postedBy: {
           id: postedById,
           name: "John",
           __typename: 'User'
         },
         __typename: 'Task',
       },
     },
      update: (store, { data: { createTask } }) => {
        const data = store.readQuery({
          query: ALL_TASKS_QUERY,
        })
        const existingIndex = data.allTasks.findIndex((t) => t.id === tmpTaskID);
        if (existingIndex !== -1) {
          data.allTasks[existingIndex] = createTask;
        } else {
          data.allTasks.push(createTask)
        }
        // data.allTasks.pop()
        // console.log("data2", data.allTasks.pop())
        store.writeQuery({
          query: ALL_TASKS_QUERY,
          data,
        })
        this.props.history.push(`/tasks`)
      }
    })
  }

  _deleteComplete = async (completeId) => {
    if (completeId) {
      await this.props.DeleteCompleteMutation({
        variables: {
          completeId
        },
        update: (store, { data: { deleteComplete } }) => {
          const data = store.readQuery({
            query: ALL_TASKS_QUERY,
          })
          store.writeQuery({
            query: ALL_TASKS_QUERY,
            data,
          })
          this.props.history.push(`/tasks`)
        }
      })
    }
  }

  _deleteTask = async (completeId, taskId) => {
    const postedById = localStorage.getItem(GC_USER_ID)
    if (!postedById) {
      console.error('No user logged in')
      return
    }
    this._deleteComplete(completeId)
    await this.props.DeleteTaskMutation({
      variables: {
        taskId
      },
      update: (store, { data: {deleteTask } }) => {
        let taskIndex
        const data = store.readQuery({
          query: ALL_TASKS_QUERY,
        })
        const bindex = data.allTasks.findIndex(b => b.id === taskId)
        if (bindex > -1) {
          taskIndex = bindex
        }
        data.allTasks.splice(taskIndex,1);
        store.writeQuery({
          query: ALL_TASKS_QUERY,
          data
        })
      }
    })
  }

  _completeTask = async (taskId, user) => {
    await this.props.CompleteTaskMutation({
      variables: {
        taskId,
        user
      },
      update: (store, { data: { completeTask } }) => {
        const data = store.readQuery({
          query: ALL_TASKS_QUERY,
        })
        store.writeQuery({
          query: ALL_TASKS_QUERY,
          data,
        })
        this.props.history.push(`/tasks`)
      }
    })
  }

  render() {
    return (
      <div>
        <div className='flex flex-column mt3'>
          <input
            className='mb2'
            value={this.state.description}
            onChange={(e) => this.setState({ description: e.target.value })}
            type='text'
            placeholder='What needs to get done?'
          />
        </div>
          <button
            style={{padding: "1em", marginBottom: "1em"}}
            onClick={() => this._createTask()}
          >
            Add Task
          </button>

        <TasksList tasksQuery={this.props.AllTasksQuery} deleteTask={this._deleteTask} completeTask={this._completeTask}/>
      </div>
    );
  }
}

const CREATE_TASK_MUTATION = gql`
  mutation CreateTaskMutation($description: String!, $postedById: ID!) {
    createTask(
      description: $description,
        postedById: $postedById
      ) {
        id
        __typename
        createdAt
        description
        completed {
          id
          user
        }
        postedBy {
          id
          __typename
          name
        }
      }
    }
  `

const ALL_TASKS_QUERY = gql`
  query AllTasksQuery {
    allTasks {
      id
      description
      completed {
        id
        user
      }
      postedBy {
        id
      }
    }
  }
`

const DELETE_TASK_MUTATION = gql`
  mutation DeleteTaskMutation($taskId: ID!) {
    deleteTask(id: $taskId) {
      id
    }
  }
`

const DELETE_COMPLETE_MUTATION = gql`
  mutation DeleteCompleteMutation($completeId: ID!) {
    deleteComplete(id: $completeId) {
      id
    }
  }
`

const COMPLETE_TASK_MUTATION = gql`
  mutation CompleteTaskMutation($taskId: ID!, $user: String) {
    createComplete(taskId: $taskId, user: $user) {
      id
    }
  }
`

const TasksWithMutations = compose(
  graphql(CREATE_TASK_MUTATION, { name: 'CreateTaskMutation' }),
  graphql(ALL_TASKS_QUERY, { name: 'AllTasksQuery' }),
  graphql(DELETE_TASK_MUTATION, { name: 'DeleteTaskMutation' }),
  graphql(DELETE_COMPLETE_MUTATION, { name: 'DeleteCompleteMutation' }),
  graphql(COMPLETE_TASK_MUTATION, { name: 'CompleteTaskMutation' })
)(Tasks)

export default TasksWithMutations
