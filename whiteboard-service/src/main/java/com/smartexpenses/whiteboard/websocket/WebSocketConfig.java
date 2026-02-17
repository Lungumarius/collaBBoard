package com.smartexpenses.whiteboard.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time collaboration
 * Uses STOMP protocol over WebSocket for message passing
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker to carry messages back to clients
        // Messages with prefix "/topic" are routed to subscribers
        config.enableSimpleBroker("/topic");
        
        // Messages with prefix "/app" are routed to @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint - clients connect to this
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins (in production, restrict to your frontend domain)
                .withSockJS(); // Enable SockJS fallback options for browsers that don't support WebSocket
    }
}
