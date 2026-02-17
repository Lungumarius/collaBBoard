package com.smartexpenses.whiteboard.config;

import com.smartexpenses.whiteboard.websocket.WebSocketSecurityInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration for WebSocket security (JWT authentication)
 * Note: WebSocket is enabled in WebSocketConfig, this only adds security interceptor
 */
@Configuration
@RequiredArgsConstructor
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketSecurityInterceptor securityInterceptor;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add interceptor to validate JWT tokens on WebSocket connections
        registration.interceptors(securityInterceptor);
    }
}
