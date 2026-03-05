<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTodoRequest;
use App\Http\Requests\UpdateTodoRequest;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->todos();

        if ($request->has('completed')) {
            $query->where('completed', filter_var($request->completed, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        if (in_array($sortField, ['created_at', 'due_date', 'priority'])) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        $todos = $query->paginate(15);

        return response()->json($todos);
    }

    public function store(StoreTodoRequest $request): JsonResponse
    {
        $todo = $request->user()->todos()->create($request->validated());

        return response()->json($todo, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $todo = $request->user()->todos()->findOrFail($id);

        return response()->json($todo);
    }

    public function update(UpdateTodoRequest $request, int $id): JsonResponse
    {
        $todo = $request->user()->todos()->findOrFail($id);
        $todo->update($request->validated());

        return response()->json($todo);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $todo = $request->user()->todos()->findOrFail($id);
        $todo->delete();

        return response()->json(null, 204);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $todo = $request->user()->todos()->findOrFail($id);
        $todo->update(['completed' => ! $todo->completed]);

        return response()->json($todo);
    }
}
