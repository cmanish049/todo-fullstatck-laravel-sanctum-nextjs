<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        return $this->issueTokens($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        return $this->issueTokens($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        if ($request->refresh_token) {
            RefreshToken::where('token', hash('sha256', $request->refresh_token))
                ->where('user_id', $request->user()->id)
                ->update(['revoked' => true]);
        }

        return response()->json(['message' => 'Logged out.']);
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $hashedToken = hash('sha256', $request->refresh_token);

        $refreshToken = RefreshToken::where('token', $hashedToken)
            ->where('revoked', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $refreshToken) {
            return response()->json([
                'message' => 'Invalid or expired refresh token.',
            ], 401);
        }

        $refreshToken->update(['revoked' => true]);

        $user = $refreshToken->user;

        return $this->issueTokens($user);
    }

    private function issueTokens(User $user, int $status = 200): JsonResponse
    {
        $user->tokens()->delete();

        $accessToken = $user->createToken('access-token', ['*'], now()->addMinutes(15));

        $plainRefreshToken = Str::random(64);

        $user->refreshTokens()->create([
            'token' => hash('sha256', $plainRefreshToken),
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'access_token' => $accessToken->plainTextToken,
            'refresh_token' => $plainRefreshToken,
            'expires_in' => 900,
        ], $status);
    }
}
