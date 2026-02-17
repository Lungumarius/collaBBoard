package com.smartexpenses.whiteboard.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class ResourceNotFoundException extends WhiteboardException {

    public ResourceNotFoundException(String resourceName, UUID id) {
        super(String.format("%s with id %s not found", resourceName, id), HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
